# Webhook API 接口文档

## 概述

Webhook API 提供了两个主要功能，用于第三方系统与消息同步系统进行集成：

1. **消息接收接口** (`/api/webhook`) - 接收外部系统发送的短信和邮件消息
2. **登录验证接口** (`/api/webhook/login`) - 验证用户凭据并获取用户信息

### 主要特性
- ✅ 支持 SMS 和 EMAIL 两种消息类型
- ✅ 安全的 Webhook Key 认证机制
- ✅ 完整的参数验证和错误处理
- ✅ 小驼峰命名风格，符合代码规范
- ✅ 详细的日志记录和调试信息

## 认证机制

### Webhook Key 认证
- 每个用户都有唯一的 `webhookKey`（UUID格式）
- 通过请求体中的 `webhookKey` 字段传递
- 系统会验证 webhookKey 与用户名的匹配关系
- 验证失败返回 401 状态码

### 用户认证
- 通过请求体中的 `username` 字段传递用户名
- 通过请求体中的 `password` 字段传递密码（仅登录接口使用）

## 关键字段说明

### sourceType 字段的重要性

**`sourceType` 是webhook接口的核心字段，具有以下关键特性：**

1. **直接映射到数据库**
   - `sourceType` 字段直接对应 Message 模型中的 `type` 字段
   - 该字段决定了消息在数据库中的存储类型
   - 影响后续的消息查询、过滤和分类功能

2. **严格的枚举验证**
   - 只支持 `SMS` 和 `EMAIL` 两种类型
   - 对应 Prisma schema 中的 `MessageType` 枚举
   - 不区分大小写，系统自动转换为大写存储

3. **业务逻辑影响**
   - 不同类型的消息可能有不同的处理逻辑
   - 影响消息的显示方式和过滤规则
   - 为后续功能扩展提供基础（如邮件模板、短信模板等）

4. **数据完整性保证**
   - 确保所有存储的消息都有明确的类型标识
   - 便于数据统计和分析
   - 支持按类型进行消息管理

**⚠️ 重要提醒：**
- 必须正确设置 `sourceType` 字段，否则消息无法正确存储
- 该字段决定了消息在系统中的分类和处理方式
- 建议在集成时仔细验证此字段的值

## API 端点

### 1. 消息接收接口

**接口地址：** `POST /api/webhook`

**功能描述：** 接收外部系统发送的短信或邮件消息并存储到数据库中

#### 请求头
| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `Content-Type` | string | 是 | 必须为 `application/json` |

#### 请求体
```json
{
  "username": "用户名",
  "webhookKey": "webhook密钥",
  "smsContent": "您的验证码是：123456，5分钟内有效",
  "sourceType": "SMS",
  "smsReceivedAt": "时间值",
  "timeFormat": "timestamp",
  "systemReceivedAt": 1705297800000,
  "senderPhone": "13800138000",
  "receiverCard": "主卡",
  "sourceApp": "微信",
  "rawData": "{}"
}
```

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `username` | string | 是 | 用户名 |
| `webhookKey` | string | 是 | Webhook密钥（UUID格式） |
| `smsContent` | string | 是 | 消息内容 |
| `sourceType` | string | 是 | 消息来源类型，必须是 `SMS` 或 `EMAIL`（不区分大小写） |
| `smsReceivedAt` | string/number | 否 | 短信在手机上接收的时间 |
| `timeFormat` | string | 否 | 时间格式（提供smsReceivedAt时必填）：`timestamp` 或 `iso` |
| `systemReceivedAt` | number | 否 | 系统接收时间戳（毫秒），不提供则使用当前时间 |
| `senderPhone` | string | 否 | 发件人号码 |
| `receiverCard` | string | 否 | 接收手机卡标识 |
| `sourceApp` | string | 否 | 来源应用标识 |
| `rawData` | string | 否 | 原始数据JSON字符串 |

#### 验证规则

1. **认证信息验证**
   - `username` 和 `webhookKey` 必须同时提供
   - 系统会验证 webhookKey 与用户名的匹配关系

2. **消息来源类型验证（关键）**
   - `sourceType` 是**核心字段**，直接决定消息在数据库中的存储类型
   - 必须是 `SMS` 或 `EMAIL`，对应 Message 模型的 `type` 字段
   - 不区分大小写，系统会自动转换为大写存储
   - **其他值将返回 400 错误，消息无法存储**
   - 此字段影响整个消息的生命周期和业务逻辑

3. **消息内容验证**
   - `smsContent` 字段不能为空
   - 空内容将返回 400 错误

4. **时间格式验证**
   - 如果提供 `smsReceivedAt`，必须同时提供 `timeFormat`
   - `timeFormat` 只支持 `timestamp` 或 `iso`
   - 如果提供 `smsReceivedAt` 但缺少 `timeFormat`，将返回 400 错误

#### 响应格式

**成功响应：**
```json
{
  "success": true
}
```

**错误响应：**
```json
{
  "success": false,
  "message": "错误描述"
}
```

#### 状态码
- `200` - 请求成功
- `400` - 请求参数错误（缺少必要参数、参数格式错误或消息类型不支持）
- `401` - 认证失败（Webhook Key 验证失败）
- `500` - 服务器内部错误

#### 使用示例

**发送短信消息：**
```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "webhookKey": "550e8400-e29b-41d4-a716-446655440000",
    "smsContent": "您的验证码是：123456，5分钟内有效",
    "sourceType": "SMS",
    "smsReceivedAt": "2025-01-20T10:30:00.000Z",
    "timeFormat": "iso",
    "senderPhone": "13800138000",
    "receiverCard": "主卡",
    "sourceApp": "微信"
  }'
```

**发送邮件消息：**
```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "webhookKey": "550e8400-e29b-41d4-a716-446655440000",
    "smsContent": "您收到一封新邮件：验证码 123456",
    "sourceType": "EMAIL",
    "smsReceivedAt": "2025-01-20T10:30:00.000Z",
    "timeFormat": "iso",
    "senderPhone": "test@example.com",
    "receiverCard": "邮箱",
    "sourceApp": "Gmail"
  }'
```

**使用时间戳格式：**
```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "webhookKey": "550e8400-e29b-41d4-a716-446655440000",
    "smsContent": "时间戳格式测试",
    "sourceType": "SMS",
    "smsReceivedAt": 1705297800000,
    "timeFormat": "timestamp"
  }'
```

**最小化调用（只提供必填字段）：**
```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "webhookKey": "550e8400-e29b-41d4-a716-446655440000",
    "smsContent": "简单测试消息",
    "sourceType": "SMS"
  }'
```

### 2. 登录验证接口

**接口地址：** `POST /api/webhook/login`

**功能描述：** 验证用户凭据，返回用户信息（包含webhookKey）

#### 请求头
| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `Content-Type` | string | 是 | 必须为 `application/json` |

#### 请求体
```json
{
  "username": "testuser",
  "password": "password123"
}
```

| 字段名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `username` | string | 是 | 用户名 |
| `password` | string | 是 | 密码 |

#### 响应格式

**成功响应：**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "testuser",
    "webhookKey": "550e8400-e29b-41d4-a716-446655440000",
    "isAdmin": false,
    "canManageTemplates": false,
    "expiryDate": "20991231",
    "createdAt": 1705297800000
  }
}
```

**错误响应：**
```json
{
  "success": false,
  "message": "用户名或密码错误"
}
```

#### 状态码
- `200` - 请求成功
- `400` - 请求参数错误（用户名或密码为空）
- `500` - 服务器内部错误

#### 使用示例

```bash
curl -X POST http://localhost:3000/api/webhook/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

## 错误处理

### 常见错误码及说明

| 状态码 | 错误类型 | 说明 | 解决方案 |
|--------|----------|------|----------|
| 400 | 参数错误 | 缺少必要的参数、参数格式错误或消息类型不支持 | 检查请求体格式和参数值 |
| 401 | 认证失败 | Webhook Key 验证失败 | 确认用户名和 webhookKey 的正确性 |
| 500 | 服务器错误 | 服务器内部处理错误 | 检查服务器日志，稍后重试 |

### 错误响应格式
所有错误响应都遵循统一格式：
```json
{
  "success": false,
  "message": "具体的错误描述信息"
}
```

### 常见错误场景

1. **缺少认证信息**
   ```json
   {
     "success": false,
     "message": "缺少认证信息 (需要 username 和 webhookKey)"
   }
   ```

2. **不支持的消息来源类型（严重错误）**
   ```json
   {
     "success": false,
     "message": "不支持的消息来源类型，只支持 SMS 或 EMAIL"
   }
   ```
   **影响：** 消息无法存储到数据库，整个请求失败

3. **Webhook Key 验证失败**
   ```json
   {
     "success": false,
     "message": "Webhook Key 验证失败"
   }
   ```

4. **缺少消息内容**
   ```json
   {
     "success": false,
     "message": "缺少消息内容 (smsContent)"
   }
   ```

5. **缺少消息来源类型**
   ```json
   {
     "success": false,
     "message": "缺少消息来源类型 (sourceType)"
   }
   ```

6. **时间格式错误**
   ```json
   {
     "success": false,
     "message": "提供了smsReceivedAt时必须指定timeFormat (timestamp 或 iso)"
   }
   ```

## 安全注意事项

1. **Webhook Key 安全**
   - Webhook Key 是敏感信息，请妥善保管
   - 不要在日志中记录完整的 Webhook Key
   - 定期更换 Webhook Key
   - 使用HTTPS传输

2. **请求频率限制**
   - 建议控制请求频率，避免过于频繁的调用
   - 系统会自动记录所有请求日志
   - 建议实现重试机制

3. **数据验证**
   - 发送前请验证消息内容的格式和长度
   - 时间戳建议使用毫秒级精度
   - 确保消息来源类型正确（SMS 或 EMAIL）

## 集成建议

### 1. JavaScript/Node.js 集成

**消息接收集成：**
```javascript
/**
 * 发送消息到webhook接口
 * @param {string} username - 用户名
 * @param {string} webhookKey - Webhook密钥
 * @param {object} message - 消息对象
 * @param {string} sourceType - 消息来源类型 (SMS/EMAIL)
 * @returns {Promise<object>} 响应结果
 */
async function sendMessage(username, webhookKey, message, sourceType = 'SMS') {
  try {
    const response = await fetch('/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        webhookKey: webhookKey,
        smsContent: message.smsContent,
        sourceType: sourceType.toUpperCase(),
        smsReceivedAt: message.smsReceivedAt,
        timeFormat: message.timeFormat,
        senderPhone: message.senderPhone,
        receiverCard: message.receiverCard,
        sourceApp: message.sourceApp
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('发送消息失败:', error);
    return { success: false, message: '网络请求失败' };
  }
}

// 使用示例
const result = await sendMessage('testuser', 'webhook-key', {
  smsContent: '您的验证码是：123456',
  smsReceivedAt: '2025-01-20T10:30:00.000Z',
  timeFormat: 'iso',
  senderPhone: '13800138000'
}, 'SMS');

if (result.success) {
  console.log('消息发送成功');
} else {
  console.error('消息发送失败:', result.message);
}
```

**用户验证集成：**
```javascript
/**
 * 验证用户凭据
 * @param {string} username - 用户名
 * @param {string} password - 密码
 * @returns {Promise<object>} 用户信息
 */
async function validateUser(username, password) {
  try {
    const response = await fetch('/api/webhook/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: username,
        password: password
      })
    });
    
    return await response.json();
  } catch (error) {
    console.error('用户验证失败:', error);
    return { success: false, message: '网络请求失败' };
  }
}

// 使用示例
const userInfo = await validateUser('testuser', 'password123');
if (userInfo.success) {
  console.log('用户验证成功:', userInfo.data.webhookKey);
} else {
  console.error('用户验证失败:', userInfo.message);
}
```

### 2. Python 集成

```python
import requests
import json
from datetime import datetime

def send_message(username, webhook_key, sms_content, source_type="SMS", sms_received_at=None, time_format=None, sender_phone=None, receiver_card=None, source_app=None):
    """
    发送消息到webhook接口
    
    Args:
        username (str): 用户名
        webhook_key (str): Webhook密钥
        sms_content (str): 消息内容
        source_type (str): 消息来源类型 (SMS/EMAIL)
        sms_received_at (str/int): 短信在手机上接收的时间
        time_format (str): 时间格式 (timestamp/iso)
        sender_phone (str): 发件人号码
        receiver_card (str): 接收手机卡标识
        source_app (str): 来源应用标识
    
    Returns:
        dict: 响应结果
    """
    url = "http://localhost:3000/api/webhook"
    headers = {
        "Content-Type": "application/json"
    }
    
    data = {
        "username": username,
        "webhookKey": webhook_key,
        "smsContent": sms_content,
        "sourceType": source_type.upper()
    }
    
    if sms_received_at:
        data["smsReceivedAt"] = sms_received_at
        if time_format:
            data["timeFormat"] = time_format
    
    if sender_phone:
        data["senderPhone"] = sender_phone
    if receiver_card:
        data["receiverCard"] = receiver_card
    if source_app:
        data["sourceApp"] = source_app
    
    try:
        response = requests.post(url, headers=headers, json=data)
        return response.json()
    except Exception as e:
        return {"success": False, "message": f"请求失败: {str(e)}"}

# 使用示例
result = send_message(
    username="testuser",
    webhook_key="550e8400-e29b-41d4-a716-446655440000",
    sms_content="您的验证码是：123456",
    source_type="SMS",
    sms_received_at="2025-01-20T10:30:00.000Z",
    time_format="iso",
    sender_phone="13800138000",
    receiver_card="主卡",
    source_app="微信"
)

if result["success"]:
    print("消息发送成功")
else:
    print(f"消息发送失败: {result['message']}")
```

### 3. PHP 集成

```php
<?php

/**
 * 发送消息到webhook接口
 * 
 * @param string $username 用户名
 * @param string $webhookKey Webhook密钥
 * @param string $smsContent 消息内容
 * @param string $sourceType 消息来源类型 (SMS/EMAIL)
 * @param string|null $smsReceivedAt 短信在手机上接收的时间
 * @param string|null $timeFormat 时间格式 (timestamp/iso)
 * @param string|null $senderPhone 发件人号码
 * @param string|null $receiverCard 接收手机卡标识
 * @param string|null $sourceApp 来源应用标识
 * @return array 响应结果
 */
function sendMessage($username, $webhookKey, $smsContent, $sourceType = 'SMS', $smsReceivedAt = null, $timeFormat = null, $senderPhone = null, $receiverCard = null, $sourceApp = null) {
    $url = 'http://localhost:3000/api/webhook';
    
    $headers = [
        'Content-Type: application/json'
    ];
    
    $data = [
        'username' => $username,
        'webhookKey' => $webhookKey,
        'smsContent' => $smsContent,
        'sourceType' => strtoupper($sourceType)
    ];
    
    if ($smsReceivedAt) {
        $data['smsReceivedAt'] = $smsReceivedAt;
        if ($timeFormat) {
            $data['timeFormat'] = $timeFormat;
        }
    }
    
    if ($senderPhone) {
        $data['senderPhone'] = $senderPhone;
    }
    if ($receiverCard) {
        $data['receiverCard'] = $receiverCard;
    }
    if ($sourceApp) {
        $data['sourceApp'] = $sourceApp;
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($response === false) {
        return ['success' => false, 'message' => '网络请求失败'];
    }
    
    return json_decode($response, true);
}

// 使用示例
$result = sendMessage(
    'testuser',
    '550e8400-e29b-41d4-a716-446655440000',
    '您的验证码是：123456',
    'SMS',
    '2025-01-20T10:30:00.000Z',
    'iso',
    '13800138000',
    '主卡',
    '微信'
);

if ($result['success']) {
    echo "消息发送成功\n";
} else {
    echo "消息发送失败: " . $result['message'] . "\n";
}

?>
```

## 数据库结构

### 用户表 (User)
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  webhook_key TEXT UNIQUE NOT NULL,
  created_at BIGINT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  can_manage_templates BOOLEAN DEFAULT FALSE,
  expiry_date TEXT DEFAULT '20991231'
);
```

### 消息表 (Message)
```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  sms_content TEXT NOT NULL,
  rec_time TEXT,
  received_at BIGINT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('SMS', 'EMAIL')),
  FOREIGN KEY (username) REFERENCES users(username)
);
```

### MessageType 枚举
```prisma
enum MessageType {
  SMS
  EMAIL
}
```

## 测试示例

### 1. 测试环境准备

首先确保有一个测试用户：

```bash
# 创建测试用户（通过管理员接口）
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "x-admin-password: admin123" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

### 2. 测试消息接收接口

**测试用例1：发送SMS消息**
```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "webhookKey": "YOUR_WEBHOOK_KEY",
    "smsContent": "测试短信：验证码 123456",
    "sourceType": "SMS",
    "smsReceivedAt": "2025-01-20T10:30:00.000Z",
    "timeFormat": "iso",
    "senderPhone": "13800138000",
    "receiverCard": "主卡",
    "sourceApp": "微信"
  }'
```

**测试用例2：发送EMAIL消息**
```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "webhookKey": "YOUR_WEBHOOK_KEY",
    "smsContent": "测试邮件：您收到一封新邮件",
    "sourceType": "EMAIL",
    "smsReceivedAt": "2025-01-20T10:30:00.000Z",
    "timeFormat": "iso",
    "senderPhone": "test@example.com",
    "receiverCard": "邮箱",
    "sourceApp": "Gmail"
  }'
```

**测试用例3：错误的消息来源类型**
```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "webhookKey": "YOUR_WEBHOOK_KEY",
    "smsContent": "测试消息",
    "sourceType": "INVALID_TYPE"
  }'
```

**测试用例4：缺少消息内容**
```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "webhookKey": "YOUR_WEBHOOK_KEY",
    "sourceType": "SMS"
  }'
```

**测试用例5：缺少时间格式**
```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "webhookKey": "YOUR_WEBHOOK_KEY",
    "smsContent": "测试消息",
    "sourceType": "SMS",
    "smsReceivedAt": "2025-01-20T10:30:00.000Z"
  }'
```

### 3. 测试登录验证接口

**测试用例1：正确的用户名和密码**
```bash
curl -X POST http://localhost:3000/api/webhook/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

**测试用例2：错误的密码**
```bash
curl -X POST http://localhost:3000/api/webhook/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "wrongpassword"
  }'
```

**测试用例3：缺少参数**
```bash
curl -X POST http://localhost:3000/api/webhook/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser"
  }'
```

### 4. 验证消息存储

发送消息后，可以通过用户消息接口验证消息是否正确存储：

```bash
curl -X GET "http://localhost:3000/api/user/messages?page=1&pageSize=10" \
  -H "x-username: testuser" \
  -H "x-password: testpass123"
```

## 最佳实践

### 1. 错误处理
- 始终检查响应状态码和success字段
- 实现重试机制处理临时网络错误
- 记录详细的错误日志用于调试
- **特别注意sourceType字段的验证错误，这是导致消息存储失败的主要原因**

### 2. sourceType 字段最佳实践
- **严格验证**：确保只传递 `SMS` 或 `EMAIL` 值
- **大小写处理**：虽然系统不区分大小写，但建议统一使用大写
- **业务逻辑**：根据实际业务需求正确设置消息来源类型
- **测试验证**：在集成前充分测试两种类型的消息发送
- **错误监控**：特别关注sourceType相关的错误响应

### 3. 性能优化
- 批量发送消息时控制并发数量
- 使用连接池复用HTTP连接
- 合理设置超时时间

### 4. 监控和日志
- 监控API调用成功率
- 记录请求响应时间
- 设置告警机制
- **特别监控sourceType验证失败的情况**

### 5. 安全性
- 定期轮换Webhook Key
- 使用HTTPS传输
- 验证消息来源的合法性

## 更新日志

- **v2.0.0** - 认证信息移至请求体
  - 认证信息从请求头改为请求体中的 `username` 和 `webhookKey` 字段
  - 保持其他所有参数命名不变
  - 更简洁的调用方式，认证信息统一在JSON中
- **v1.2.0** - 优化字段命名，统一使用小驼峰风格
- **v1.1.0** - 增强消息类型验证，支持 SMS 和 EMAIL 两种类型
- **v1.0.0** - 初始版本，支持基本的消息接收和用户验证功能
- 完整的错误处理和日志记录
- 安全的 Webhook Key 认证机制
- 严格的消息类型验证（SMS/EMAIL）
- 多语言集成示例（JavaScript、Python、PHP） 