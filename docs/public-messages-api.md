# 公共消息API完整文档

## 接口概述

**接口路径**: `GET /api/public/messages`  
**功能**: 根据卡密链接获取用户的最新消息内容，支持消息过滤和规则处理  
**认证方式**: 无需认证（公共接口）  
**适用场景**: 第三方应用通过卡密链接获取用户消息

## 请求参数

### 必需参数

| 参数名 | 类型 | 说明 | 示例 |
|--------|------|------|------|
| `cardKey` | string | 卡密链接密钥 | `ABC123DEF456GHIJ` |
| `appName` | string | 应用名称 | `微信` |
| `phone` | string | 手机号码 | `13800138000` |

### 请求示例

```bash
# 基础请求
GET /api/public/messages?cardKey=ABC123DEF456GHIJ&appName=微信&phone=13800138000

# 包含中文参数的请求
GET /api/public/messages?cardKey=ABC123DEF456GHIJ&appName=%E5%BE%AE%E4%BF%A1&phone=13800138000
```

## 响应格式

### 成功响应

```json
{
  "success": true,
  "message": "您的验证码是123456，5分钟内有效",
  "firstUsedAt": 1703123456789
}
```

### 错误响应

```json
{
  "success": false,
  "error": "错误信息"
}
```

## 完整业务逻辑流程

### 1. 参数处理阶段

#### 1.1 参数获取与URL解码

```javascript
// 获取原始参数
const cardKey = searchParams.get('cardKey');
const appName = searchParams.get('appName');
const phone = searchParams.get('phone');

// URL解码处理（支持中文和特殊字符）
const decodedCardKey = cardKey ? decodeURIComponent(cardKey) : null;
const decodedAppName = appName ? decodeURIComponent(appName) : null;
const decodedPhone = phone ? decodeURIComponent(phone) : null;
```

**示例**:
```javascript
// 原始参数
cardKey: "ABC123DEF456GHIJ"
appName: "%E5%BE%AE%E4%BF%A1"  // URL编码的"微信"
phone: "13800138000"

// 解码后
decodedCardKey: "ABC123DEF456GHIJ"
decodedAppName: "微信"
decodedPhone: "13800138000"
```

#### 1.2 参数验证

**验证规则**: 所有三个参数都必须存在且不为空

```javascript
if (!decodedCardKey || !decodedAppName || !decodedPhone) {
    return NextResponse.json(
        { success: false, error: '缺少必要参数 (cardKey, appName, phone)' },
        { status: 400 }
    );
}
```

**错误示例**:
```bash
# 缺少cardKey
GET /api/public/messages?appName=微信&phone=13800138000
# 响应: { "success": false, "error": "缺少必要参数 (cardKey, appName, phone)" }

# 缺少appName
GET /api/public/messages?cardKey=ABC123&phone=13800138000
# 响应: { "success": false, "error": "缺少必要参数 (cardKey, appName, phone)" }
```

### 2. 卡密链接验证阶段

#### 2.1 数据库查询

```javascript
const cardLink = await prisma.cardLink.findUnique({
    where: {
        cardKey: decodedCardKey,      // 精确匹配
        appName: decodedAppName,      // 精确匹配
        phone: decodedPhone           // 精确匹配
    },
    select: {
        username: true,
        firstUsedAt: true,
        templateId: true
    }
});
```

**匹配方式**: **精确匹配** - 使用复合唯一索引

**示例数据**:
```javascript
// 数据库中的卡密链接记录
{
    cardKey: "ABC123DEF456GHIJ",
    appName: "微信",
    phone: "13800138000",
    username: "user123",
    firstUsedAt: null,
    templateId: "template_001"
}

// 查询结果
{
    username: "user123",
    firstUsedAt: null,
    templateId: "template_001"
}
```

#### 2.2 查询失败处理

如果卡密链接不存在，Prisma会返回null，导致后续代码报错。系统会捕获异常并返回500错误。

### 3. 首次使用时间处理阶段

#### 3.1 firstUsedAt更新逻辑

```javascript
let firstUsedAt = cardLink.firstUsedAt;
if (!firstUsedAt) {
    // 首次访问，更新firstUsedAt为当前时间
    const currentTime = Date.now();
    
    await prisma.cardLink.update({
        where: {
            cardKey: decodedCardKey,
            appName: decodedAppName,
            phone: decodedPhone
        },
        data: { firstUsedAt: currentTime }
    });
    
    firstUsedAt = currentTime;
}
```

**业务逻辑**:
- 如果`firstUsedAt`为空，说明是首次访问
- 更新为当前时间戳，标记为已使用
- 后续查询只返回首次使用时间之后的消息

**示例**:
```javascript
// 首次访问前
firstUsedAt: null

// 首次访问后
firstUsedAt: 1703123456789

// 后续访问
firstUsedAt: 1703123456789  // 保持不变
```

### 4. 消息查询阶段

#### 4.1 查询条件

```javascript
const messages = await prisma.message.findMany({
    where: {
        username: cardLink.username,                    // 精确匹配用户名
        systemReceivedAt: { gt: firstUsedAt },         // 时间范围过滤
        senderPhone: { contains: decodedPhone }         // 发送者手机号模糊匹配
    },
    orderBy: { systemReceivedAt: 'desc' },             // 按时间倒序
    select: {
        id: true,
        smsContent: true,
        smsReceivedAt: true,
        systemReceivedAt: true,
        sourceType: true,
        senderPhone: true
    }
});
```

#### 4.2 匹配条件详解

| 条件 | 匹配方式 | 说明 | 示例 |
|------|---------|------|------|
| `username` | **精确匹配** | 用户名必须完全相等 | `username = "user123"` |
| `systemReceivedAt` | **范围匹配** | 系统接收时间必须大于首次使用时间 | `systemReceivedAt > 1703123456789` |
| `senderPhone` | **模糊匹配** | 发送者手机号必须连续包含phone参数 | `senderPhone LIKE "%13800138000%"` |

#### 4.3 senderPhone模糊匹配示例

```javascript
// 假设 phone = "13800138000"

// 匹配成功的情况
senderPhone: "13800138000"           // 完全相等
senderPhone: "bank_13800138000"      // 后缀包含
senderPhone: "13800138000_verify"    // 前缀包含
senderPhone: "sms_13800138000_code"  // 中间包含

// 匹配失败的情况
senderPhone: "1380013800"            // 不完整
senderPhone: "138001380001"          // 超出长度
senderPhone: "138_001_380_00"        // 不连续
senderPhone: null                    // 空值
```

#### 4.4 查询结果示例

```javascript
// 查询到的消息列表
[
    {
        id: 1,
        smsContent: "您的验证码是123456，5分钟内有效",
        smsReceivedAt: 1703123456789,
        systemReceivedAt: 1703123456790,
        sourceType: "sms",
        senderPhone: "bank_13800138000"
    },
    {
        id: 2,
        smsContent: "您的订单已发货，物流单号：SF1234567890",
        smsReceivedAt: 1703123400000,
        systemReceivedAt: 1703123400001,
        sourceType: "sms",
        senderPhone: "logistics_13800138000"
    }
]
```

### 5. 规则管道处理阶段

#### 5.1 规则处理触发条件

```javascript
let processedMessages = messages;
if (cardLink.templateId) {
    // 有模板ID才进行规则处理
    processedMessages = await processMessagesWithRules(messages, cardLink.templateId);
} else {
    // 无模板ID，跳过规则处理
    processedMessages = messages;
}
```

#### 5.2 规则类型与匹配方式

**1. 文本包含规则** (`simple_include`)
```javascript
// 匹配方式: 模糊匹配
// 逻辑: 保留包含指定文本的消息
rule: { mode: "simple_include", pattern: "验证码" }
// 结果: 只保留包含"验证码"的消息
```

**2. 文本排除规则** (`simple_exclude`)
```javascript
// 匹配方式: 模糊匹配
// 逻辑: 保留不包含指定文本的消息
rule: { mode: "simple_exclude", pattern: "广告" }
// 结果: 排除包含"广告"的消息
```

**3. 正则表达式规则** (`regex`, `regex_include`, `regex_exclude`)
```javascript
// 匹配方式: 正则匹配（不区分大小写）
rule: { mode: "regex_include", pattern: "\\d{6}" }
// 结果: 只保留包含6位数字的消息
```

**4. 时间过滤规则** (`within_minutes`, `within_hours`, `within_days`)
```javascript
// 匹配方式: 时间范围匹配
rule: { mode: "within_minutes", pattern: "5" }
// 结果: 只保留5分钟内的消息
```

**5. 长度过滤规则** (`min_length`, `max_length`, `exact_length`)
```javascript
// 匹配方式: 数值比较匹配
rule: { mode: "min_length", pattern: "10" }
// 结果: 只保留长度大于等于10的消息
```

#### 5.3 规则管道执行示例

```javascript
// 假设有以下规则
const rules = [
    { id: "rule1", mode: "simple_exclude", pattern: "广告", orderNum: 1 },
    { id: "rule2", mode: "regex_include", pattern: "\\d{6}", orderNum: 2 },
    { id: "rule3", mode: "within_minutes", pattern: "5", orderNum: 3 }
];

// 原始消息
const messages = [
    { smsContent: "您的验证码是123456，5分钟内有效" },
    { smsContent: "广告：限时优惠，点击查看" },
    { smsContent: "您的订单已发货" }
];

// 规则1执行后（排除广告）
processedMessages = [
    { smsContent: "您的验证码是123456，5分钟内有效" },
    { smsContent: "您的订单已发货" }
];

// 规则2执行后（只保留包含6位数字的）
processedMessages = [
    { smsContent: "您的验证码是123456，5分钟内有效" }
];

// 规则3执行后（只保留5分钟内的）
processedMessages = [
    { smsContent: "您的验证码是123456，5分钟内有效" }
];
```

### 6. 最终结果处理阶段

#### 6.1 消息选择逻辑

```javascript
const finalMessage = processedMessages.length > 0 ? processedMessages[0] : null;
const messageContent = finalMessage ? finalMessage.smsContent : '';
```

**选择逻辑**: 
- 取规则处理后的第一条消息（最新消息）
- 如果没有消息，返回空字符串

#### 6.2 响应格式

```javascript
const response = {
    success: true,
    message: messageContent,        // 消息内容
    firstUsedAt: firstUsedAt        // 首次使用时间戳
};
```

**响应示例**:
```json
{
    "success": true,
    "message": "您的验证码是123456，5分钟内有效",
    "firstUsedAt": 1703123456789
}
```

## 错误处理机制

### 1. 参数验证错误

**状态码**: 400  
**触发条件**: 缺少必要参数

```json
{
    "success": false,
    "error": "缺少必要参数 (cardKey, appName, phone)"
}
```

### 2. 卡密链接不存在

**状态码**: 500  
**触发条件**: 数据库查询返回null

```json
{
    "success": false,
    "error": "获取消息失败"
}
```

### 3. 服务器内部错误

**状态码**: 500  
**触发条件**: 数据库操作失败、规则处理异常等

```json
{
    "success": false,
    "error": "获取消息失败"
}
```

## 性能优化特性

### 1. 查询优化

- **复合唯一索引**: 卡密链接查询使用复合唯一索引
- **字段选择**: 只查询必要的字段（select优化）
- **时间排序**: 按时间倒序排列，优先获取最新消息

### 2. 规则处理优化

- **失败容错**: 规则处理失败时返回原消息列表
- **正则容错**: 正则表达式无效时跳过该规则
- **提前结束**: 消息为空时提前结束规则处理

### 3. 缓存策略

- **firstUsedAt缓存**: 首次访问后缓存时间戳，避免重复计算
- **规则缓存**: 模板规则可以缓存，减少数据库查询

## 完整业务流程图

```
┌─────────────────┐
│   请求开始      │
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ 参数获取与解码  │ ← URL解码处理中文参数
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ 参数完整性验证  │ ← 精确匹配：三个参数都必须存在
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ 卡密链接查询    │ ← 精确匹配：复合唯一索引查询
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ firstUsedAt处理 │ ← 首次访问标记
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ 用户消息查询    │ ← 精确匹配用户名 + 时间范围 + 发送者手机号模糊匹配
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ 规则管道处理    │ ← 模糊匹配/正则匹配/时间匹配/长度匹配
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ 选择最新消息    │ ← 取第一条消息
└─────────┬───────┘
          │
          ▼
┌─────────────────┐
│ 返回响应        │
└─────────────────┘
```

## 关键匹配方式总结

| 处理环节 | 匹配方式 | 匹配逻辑 | 示例 |
|---------|---------|---------|------|
| 参数验证 | 精确匹配 | 三个参数都必须存在 | `cardKey && appName && phone` |
| 卡密链接查询 | 精确匹配 | 复合唯一索引查询 | `cardKey + appName + phone` |
| 用户消息查询 | 精确匹配 + 范围匹配 + 模糊匹配 | 用户名精确匹配，时间范围匹配，发送者手机号模糊匹配 | `username = "user123" AND systemReceivedAt > timestamp AND senderPhone LIKE "%phone%"` |
| 规则文本过滤 | 模糊匹配 | 使用includes()方法 | `content.includes("验证码")` |
| 规则正则过滤 | 正则匹配 | 使用RegExp.test()方法 | `regex.test(content)` |
| 规则时间过滤 | 范围匹配 | 时间戳比较 | `receivedAt > (now - minutes * 60 * 1000)` |
| 规则长度过滤 | 数值比较 | 字符串长度比较 | `content.length >= minLength` |

## 使用示例

### 1. 基础使用

```bash
# 获取用户最新消息
curl "http://localhost:3000/api/public/messages?cardKey=ABC123DEF456GHIJ&appName=微信&phone=13800138000"
```

### 2. 带中文参数

```bash
# 包含中文应用名称
curl "http://localhost:3000/api/public/messages?cardKey=ABC123DEF456GHIJ&appName=%E5%BE%AE%E4%BF%A1&phone=13800138000"
```

### 3. 错误处理测试

```bash
# 缺少参数
curl "http://localhost:3000/api/public/messages?cardKey=ABC123DEF456GHIJ&appName=微信"
# 响应: { "success": false, "error": "缺少必要参数 (cardKey, appName, phone)" }

# 无效卡密链接
curl "http://localhost:3000/api/public/messages?cardKey=INVALID&appName=微信&phone=13800138000"
# 响应: { "success": false, "error": "获取消息失败" }
```

## 监控和日志

### 1. 关键日志点

- 请求开始和结束时间
- 参数解码前后对比
- 卡密链接查询结果
- firstUsedAt更新状态
- 消息查询数量和匹配条件
- 规则处理前后消息数量
- 最终结果和响应时间

### 2. 性能监控

- 请求处理总耗时
- 数据库查询耗时
- 规则处理耗时
- 消息数量统计

### 3. 错误监控

- 参数验证失败
- 数据库查询异常
- 规则处理异常
- 响应格式错误

这个API的核心价值在于通过精确的卡密链接验证和灵活的规则管道处理，为用户提供个性化的消息过滤服务，确保消息的安全性和准确性。 