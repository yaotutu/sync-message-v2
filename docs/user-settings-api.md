# 用户设置API文档

## 概述

用户设置API允许用户管理个人设置，包括卡密链接标签、显示选项等。新增字段的使用逻辑与 `canManageTemplates` 保持一致。

## 字段权限分配

新增字段的权限分配如下：

- `cardLinkTags`: **用户自己管理** - 用户可以通过 `/api/user/profile` 更新自己的卡密链接标签
- `showFooter`: **管理员管理** - 管理员可以通过 `/api/admin/users/[username]` 控制用户是否显示底部
- `showAds`: **管理员管理** - 管理员可以通过 `/api/admin/users/[username]` 控制用户是否显示广告

## 字段一致性说明

新增的字段 (`cardLinkTags`, `showFooter`, `showAds`) 与现有的 `canManageTemplates` 字段遵循相同的使用模式：

1. **登录时返回**：在登录API中返回用户信息
2. **存储到localStorage**：登录成功后存储到本地存储
3. **通过auth工具获取**：通过 `getAuthStatus()` 获取认证状态
4. **在组件中使用**：在需要权限控制的组件中检查

## 数据库模型更新

### User模型新增字段

```prisma
model User {
  // ... 现有字段 ...
  cardLinkTags       String?    @default("[]") @map("card_link_tags") // JSON数组字符串，存储卡密链接标签
  showFooter         Boolean    @default(true) @map("show_footer")
  showAds            Boolean    @default(true) @map("show_ads")
  // ... 其他字段 ...
}
```

### 字段说明

- `cardLinkTags`: 卡密链接标签数组，以JSON字符串形式存储，默认为空数组 `[]`
- `showFooter`: 控制是否显示底部，默认为 `true`
- `showAds`: 控制是否显示广告，默认为 `true`

## API接口

### 用户登录

**POST** `/api/user/login`

登录时返回用户完整信息，包括新增的设置字段。

#### 请求体
```json
{
  "username": "aaa",
  "password": "aaa"
}
```

#### 响应示例
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "username": "aaa",
    "canManageTemplates": true,
    "expiryDate": "20991231",
    "isAdmin": false,
    "cardLinkTags": ["工作", "重要"],
    "showFooter": true,
    "showAds": true
  }
}
```

### 获取用户信息

**GET** `/api/user/profile`

获取当前用户的完整信息，包括新增的设置字段。

#### 请求头
```
x-username: 用户名
x-password: 密码
```

#### 响应示例

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "aaa",
    "webhookKey": "uuid-string",
    "isAdmin": false,
    "canManageTemplates": true,
    "expiryDate": "20991231",
    "createdAt": 1234567890,
    "cardLinkTags": ["工作", "重要"],
    "showFooter": true,
    "showAds": true
  }
}
```

### 更新用户设置

**PATCH** `/api/user/profile`

更新用户的设置信息。

#### 请求头
```
Content-Type: application/json
x-username: 用户名
x-password: 密码
```

#### 请求体

支持更新以下字段（可以单独更新或组合更新）：

```json
{
  "cardLinkTags": ["标签1", "标签2", "标签3"],
  "showFooter": false,
  "showAds": false
}
```

#### 字段验证规则

- `cardLinkTags`: 
  - 必须是数组格式
  - 数组元素必须是字符串
  - 字符串不能为空
  - 字符串长度不能超过50个字符
- `showFooter`: 必须是布尔值
- `showAds`: 必须是布尔值

#### 响应示例

```json
{
  "success": true,
  "message": "用户设置更新成功"
}
```

#### 错误响应示例

```json
{
  "success": false,
  "message": "标签必须是数组格式"
}
```

### 管理员创建用户

**POST** `/api/admin/users`

管理员创建用户时支持设置新增字段。

#### 请求头
```
Content-Type: application/json
x-admin-password: 管理员密码
```

#### 请求体
```json
{
  "username": "newuser",
  "password": "password",
  "canManageTemplates": false,
  "cardLinkTags": ["新用户"],
  "showFooter": true,
  "showAds": true
}
```

## 客户端使用

### 认证状态获取

```javascript
import { getAuthStatus } from '@/lib/utils/auth';

const authStatus = getAuthStatus();
console.log('用户标签:', authStatus.cardLinkTags);
console.log('显示底部:', authStatus.showFooter);
console.log('显示广告:', authStatus.showAds);
console.log('模板管理权限:', authStatus.canManageTemplates);
```

### 登录后存储

```javascript
// 登录成功后存储到localStorage
localStorage.setItem('user_auth', JSON.stringify({
  username: 'aaa',
  password: 'aaa',
  isAdmin: false,
  canManageTemplates: true,
  cardLinkTags: ['工作', '重要'],
  showFooter: true,
  showAds: true,
}));
```

## 使用示例

### 获取用户信息

```bash
curl -X GET http://localhost:3000/api/user/profile \
  -H "x-username: aaa" \
  -H "x-password: aaa"
```

### 更新用户标签

```bash
curl -X PATCH http://localhost:3000/api/user/profile \
  -H "Content-Type: application/json" \
  -H "x-username: aaa" \
  -H "x-password: aaa" \
  -d '{
    "cardLinkTags": ["工作", "重要", "紧急"]
  }'
```

### 管理员控制显示设置

```bash
# 管理员控制用户是否显示底部
curl -X PATCH http://localhost:3000/api/admin/users/aaa \
  -H "Content-Type: application/json" \
  -H "x-admin-password: admin123" \
  -d '{
    "showFooter": false
  }'

# 管理员控制用户是否显示广告
curl -X PATCH http://localhost:3000/api/admin/users/aaa \
  -H "Content-Type: application/json" \
  -H "x-admin-password: admin123" \
  -d '{
    "showAds": false
  }'
```

### 同时更新多个设置

```bash
# 用户更新自己的卡密链接标签
curl -X PATCH http://localhost:3000/api/user/profile \
  -H "Content-Type: application/json" \
  -H "x-username: aaa" \
  -H "x-password: aaa" \
  -d '{
    "cardLinkTags": ["个人", "备忘"]
  }'

# 管理员同时更新用户的显示设置
curl -X PATCH http://localhost:3000/api/admin/users/aaa \
  -H "Content-Type: application/json" \
  -H "x-admin-password: admin123" \
  -d '{
    "showFooter": true,
    "showAds": false
  }'
```

### 管理员创建用户

```bash
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "x-admin-password: admin123" \
  -d '{
    "username": "newuser",
    "password": "password",
    "canManageTemplates": false,
    "cardLinkTags": ["新用户"],
    "showFooter": true,
    "showAds": false
  }'
```

## 错误处理

### 常见错误

1. **认证失败** (401)
   ```json
   {
     "success": false,
     "message": "用户名或密码错误"
   }
   ```

2. **参数验证失败** (400)
   ```json
   {
     "success": false,
     "message": "标签必须是数组格式"
   }
   ```

3. **服务器错误** (500)
   ```json
   {
     "success": false,
     "message": "更新用户设置失败"
   }
   ```

## 数据库操作

### 创建用户时设置默认值

```javascript
const result = await createUserDb(
  username, 
  password, 
  webhookKey, 
  createdAt, 
  canManageTemplates,
  [], // 默认空标签数组
  true, // 默认显示底部
  true  // 默认显示广告
);
```

### 更新用户设置

```javascript
await updateUserDb(username, {
  cardLinkTags: ['新标签1', '新标签2'],
  showFooter: false,
  showAds: false
});
```

### 获取用户信息

```javascript
const user = await getUserByUsernameDb(username);
// user.cardLinkTags 会自动从JSON字符串转换为数组
console.log(user.cardLinkTags); // ['标签1', '标签2']
```

## 测试

运行测试文件验证API功能：

```bash
node test/user-settings-api-test.js
```

测试包括：
- 用户登录（验证返回字段）
- 获取用户信息
- 更新用户设置
- 更新单个字段
- 无效数据验证
- 管理员创建用户 