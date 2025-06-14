# API请求编码规则

## 数据库操作规则
1. 使用SQLite数据库，文件存储在`data/database.db`
2. 使用模板字符串标签函数执行SQL：
   - `sql` - 执行更新/插入操作
   - `sqlQuery` - 查询多条记录
   - `sqlGet` - 查询单条记录
3. 事务处理：
   ```typescript
   await transaction(async (db) => {
     // 事务操作
   });
   ```
4. JSON字段处理：
   - 存储：`JSON.stringify(value)`
   - 读取：`JSON.parse(value)`
5. 性能优化：
   - 自动启用WAL模式
   - 自动启用外键约束

## 客户端请求
1. 使用统一封装的`apiRequest`函数
2. 优先使用`userApi`和`adminApi`封装方法
3. 方法：
   - `get(url, options)`
   - `post(url, body, options)`
   - `patch(url, body, options)`
   - `delete(url, options)`
4. 认证头自动处理：
   - 用户API：`x-username`和`x-password`
   - 管理员API：`x-admin-password`

## 路由处理
1. 每个API端点单独文件
2. 使用Next.js Route Handlers
3. 命名导出对应HTTP方法(`POST`, `GET`等)
4. 参数获取：
   - GET参数：`URL.searchParams`
   - POST参数：`request.json()`
5. 响应格式：
   ```typescript
   // 成功
   NextResponse.json({success: true, ...data})
   
   // 失败
   NextResponse.json({success: false, error: '消息'}, {status: xxx})
   ```

## 错误处理
1. 统一捕获错误并返回500状态码
2. 验证失败返回400/401
3. 资源不存在返回404

## 示例代码
```typescript
// 客户端调用
const data = await userApi.post('/api/user/login', {
  username: 'test',
  password: '123456'
});

// 路由实现
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // 处理逻辑...
    return NextResponse.json({success: true, data});
  } catch (error) {
    return NextResponse.json(
      {success: false, error: '处理失败'},
      {status: 500}
    );
  }
}
```

## API测试规范

### 认证机制
1. 用户认证：
   - 通过`x-username`和`x-password`请求头认证
   - 登录接口：`POST /api/user/login`
   - 示例：
     ```bash
     curl -X POST http://localhost:3000/api/user/login \
       -H "Content-Type: application/json" \
       -d '{"username":"aaa","password":"aaa"}'
     ```

2. 管理员认证：
   - 通过`x-admin-password`请求头认证
   - 默认密码：`admin123` (可通过环境变量修改)
   - 示例：
     ```bash
     curl -X GET http://localhost:3000/api/admin/users \
       -H "x-admin-password: admin123"
     ```

3. 公共接口：
   - 无需任何认证头
   - 示例：
     ```bash
     curl -X GET "http://localhost:3000/api/public/messages?cardKey=TESTKEY&appName=testApp"
     ```

### 测试账号
```text
普通用户：
- 用户名: aaa
- 密码: aaa

管理员：
- 密码: admin123
```

### 请求示例

1. 用户登录验证：
```bash
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"username":"aaa","password":"aaa"}'
```

2. 用户API调用（需认证头）：
```bash
# 获取卡密链接
curl -X GET http://localhost:3000/api/user/cardlinks \
  -H "x-username: aaa" \
  -H "x-password: aaa"
```

3. 管理员API调用：
```bash
# 获取用户列表
curl -X GET http://localhost:3000/api/admin/users \
  -H "x-admin-password: admin123"
```

4. 公共API调用：
```bash
# 获取模板列表
curl -X GET http://localhost:3000/api/public/templates
```