# API请求编码规则

## 语言选择
1. UI开发必须使用Material UI组件库（强制要求）
   - 优先使用Material UI组件替代原生HTML元素
   - 必须从@mui/material导入组件
   - 示例：
     ```jsx
     // 正确
     import { Button, TextField } from '@mui/material';
     // 错误
     import Button from '@mui/material/Button';
     ```
2. 优先使用JavaScript(JS)和JSX语法
3. 仅在必要时使用TypeScript
4. 新页面开发和重构必须使用JSX语法

## 公共组件
1. 所有可复用公共组件存放在`src/components`目录
2. 开发时应优先使用现有公共组件
3. 当前已有组件：
   - `ConfirmDialog.jsx`：通用确认对话框组件
4. 组件修改规范：
   - 修改公共组件时需考虑向后兼容
   - 避免破坏性变更，如需重大修改应创建新版本组件
   - 修改后需测试所有引用该组件的页面


## 客户端请求
1. 使用统一封装的`apiRequest`函数
2. 优先使用`userApi`和`adminApi`封装方法
   - 用户相关请求统一使用`userApi`，自动处理用户认证
   - 管理员相关请求统一使用`adminApi`，自动处理管理员认证
3. 方法：
   - `get(url, options)`
   - `post(url, body, options)`
   - `patch(url, body, options)`
   - `delete(url, options)`
4. 认证头自动处理：
   - 用户API：自动添加`x-username`和`x-password`请求头
   - 管理员API：自动添加`x-admin-password`请求头
5. 调用示例：
   ```javascript
   // 用户API调用示例
   const userMessages = await userApi.get('/api/user/messages', {
     params: { page: 1, pageSize: 10 }
   });
   
   // 管理员API调用示例
   const allUsers = await adminApi.get('/api/admin/users');
   ```

## 路由处理
1. 每个API端点单独文件
2. 使用Next.js Route Handlers
3. 命名导出对应HTTP方法(`POST`, `GET`等)
4. 参数获取：
   - GET参数：`URL.searchParams`
   - POST参数：`request.json()`
5. 响应格式：
   ```javascript
   // 成功
   NextResponse.json({success: true, ...data})
   
   // 失败
   NextResponse.json({success: false, error: '消息'}, {status: xxx})
   ```

## 错误处理
1. 统一捕获错误并返回500状态码
2. 验证失败返回400/401
3. 资源不存在返回404

## 数据库操作
1. 所有数据库操作逻辑必须放在`src/lib/db/`目录下
2. 使用Prisma作为ORM实现数据库操作
3. 每个数据表对应一个独立的操作文件
4. 示例文件结构：
   ```
   src/lib/db/
   ├── index.js       # 数据库连接初始化
   ├── users.js       # 用户表操作
   ├── messages.js    # 消息表操作
   └── ...            # 其他表操作
   ```
5. Prisma使用示例：
   ```javascript
   // 查询用户示例
   import prisma from './index'
   
   async function getUser(username) {
     return await prisma.user.findUnique({
       where: { username }
     })
   }
   ```

## 示例代码
```javascript
// 客户端调用 - 用户API
const userData = await userApi.get('/api/user/cardlinks');

// 客户端调用 - 管理员API
const adminData = await adminApi.get('/api/admin/users');

// 路由实现 - 用户API验证
export async function GET(request) {
  const auth = getUserAuthFromRequest(request); // 从请求中获取认证信息
  
  if (!auth) {
    return NextResponse.json(
      {success: false, error: '需要认证'},
      {status: 401}
    );
  }

  // 处理业务逻辑...
  return NextResponse.json({success: true, data: []});
}

// 辅助函数 - 从请求中获取用户认证
function getUserAuthFromRequest(request) {
  const username = request.headers.get('x-username');
  const password = request.headers.get('x-password');
  
  return username && password ? {username, password} : null;
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