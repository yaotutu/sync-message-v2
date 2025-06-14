# API请求编码规则

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