# 卡密过期功能

## 功能概述

卡密过期功能允许为卡密链接设置有效期，当卡密超过有效期时，用户将无法继续使用该卡密链接。

## 工作原理

### 过期计算逻辑

1. **过期时间计算**：`过期时间 = 首次使用时间 + 过期天数`
2. **过期判断**：`当前时间 > 过期时间` 时，卡密被视为已过期

### 特殊情况处理

- **无过期天数设置**：卡密永不过期
- **过期天数为0或负数**：卡密永不过期
- **未首次使用**：卡密未过期（等待首次使用）

## API 响应格式

### 新增字段

公共消息API (`/api/public/messages`) 现在返回以下额外字段：

```json
{
  "success": true,
  "message": "短信内容",
  "firstUsedAt": 1703123456789,
  "rawMessage": { ... },
  "expiryDays": 7,        // 新增：过期天数
  "isExpired": false      // 新增：是否已过期
}
```

### 字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `expiryDays` | `number|null` | 过期天数，null表示永不过期 |
| `isExpired` | `boolean` | 是否已过期 |

## 前端页面处理

### 过期状态显示

当卡密过期时，页面会显示过期提示：

```jsx
if (data.isExpired) {
    return (
        <Alert severity="warning">
            <Typography variant="h6">卡密已过期</Typography>
            <Typography variant="body2">
                此卡密链接已超过有效期，无法继续使用。
            </Typography>
            {data.expiryDays && (
                <Typography variant="body2">
                    有效期：{data.expiryDays} 天
                </Typography>
            )}
        </Alert>
    );
}
```

### 有效期信息显示

在正常页面中，会显示卡密的有效期信息：

```jsx
{data.expiryDays && (
    <Typography variant="body2" color="info.main">
        有效期：{data.expiryDays} 天
        {firstUsedAt && (
            <>
                <span style={{ marginLeft: '8px', color: 'text.secondary' }}>
                    (过期时间：{formatFirstUsedTime(firstUsedAt + (data.expiryDays * 24 * 60 * 60 * 1000))})
                </span>
                {!data.isExpired && (
                    <span style={{ marginLeft: '8px', color: 'success.main', fontWeight: 'bold' }}>
                        (剩余 {Math.max(0, Math.ceil((firstUsedAt + (data.expiryDays * 24 * 60 * 60 * 1000) - Date.now()) / (24 * 60 * 60 * 1000)))} 天)
                    </span>
                )}
            </>
        )}
    </Typography>
)}
```

### 显示效果

页面会显示以下信息：

1. **有效期天数**：显示卡密的有效期天数
2. **过期时间**：显示具体的过期日期和时间
3. **剩余天数**：如果未过期，显示剩余的有效天数

**显示示例**：
```
有效期：7 天 (过期时间：2024/01/15 14:30:25) (剩余 5 天)
```

**过期状态显示**：
```
有效期：1 天 (过期时间：2024/01/10 14:30:25)
```

## 数据库结构

### CardLink 表字段

```sql
CREATE TABLE cardLinks (
    -- 其他字段...
    expiryDays INTEGER,  -- 过期天数，null表示永不过期
    -- 其他字段...
);
```

## 使用示例

### 创建带有效期的卡密

```javascript
// 创建7天有效期的卡密
const cardLink = await createCardLink(username, {
    appName: "微信",
    phone: "13800138000",
    expiryDays: 7
});
```

### 检查过期状态

```javascript
// API 响应中的过期检查
const response = await fetch('/api/public/messages?cardKey=ABC123&appName=微信&phone=13800138000');
const data = await response.json();

if (data.isExpired) {
    console.log('卡密已过期');
} else {
    console.log('卡密未过期');
}
```

## 测试

### 测试脚本

运行测试脚本验证过期功能：

```bash
# 测试过期逻辑
node test/test-expiration-feature.js

# 测试API响应
node test/test-expiration-api.js
```

### 测试用例

1. **无过期天数**：卡密永不过期
2. **过期天数为0**：卡密永不过期
3. **未首次使用**：卡密未过期
4. **未过期**：首次使用时间 + 过期天数 > 当前时间
5. **已过期**：首次使用时间 + 过期天数 < 当前时间

## 注意事项

1. **时间精度**：使用毫秒级时间戳进行计算
2. **时区处理**：使用服务器本地时间
3. **性能考虑**：过期检查在API层面进行，减少前端计算负担
4. **向后兼容**：现有无过期天数的卡密不受影响
5. **类型安全**：支持BigInt、字符串和数字类型的自动转换

## 类型转换处理

系统会自动处理以下数据类型的转换：

- **BigInt类型**：自动转换为Number类型进行计算
- **字符串类型**：自动转换为Number类型进行计算
- **数字类型**：直接使用

这确保了与数据库存储的BigInt类型字段的兼容性。

### 统一工具函数

为了避免在每个文件中重复实现类型转换逻辑，系统提供了统一的工具函数：

```javascript
import { 
    safeToNumber, 
    checkExpiration, 
    calculateExpiryTime, 
    formatTimestamp 
} from '@/lib/utils/type-conversion.js';
```

#### 主要函数

- `safeToNumber(value, defaultValue)` - 安全转换为数字
- `checkExpiration(firstUsedAt, expiryDays)` - 检查是否过期
- `calculateExpiryTime(firstUsedAt, expiryDays)` - 计算过期时间
- `formatTimestamp(timestamp, locale)` - 格式化时间戳
- `calculateRemainingDays(firstUsedAt, expiryDays)` - 计算剩余天数

#### 使用示例

```javascript
// API中使用
import { checkExpiration } from '@/lib/utils/type-conversion.js';

const isExpired = checkExpiration(cardLink.firstUsedAt, cardLink.expiryDays);

// 前端页面中使用
import { calculateExpiryTime, formatTimestamp } from '@/lib/utils/type-conversion.js';

const expiryTime = calculateExpiryTime(firstUsedAt, data.expiryDays);
const formattedTime = formatTimestamp(expiryTime);
```

## 开发调试

在开发环境中，页面会显示调试信息：

```
调试信息 - 过期状态: 未过期
```

这有助于开发时验证过期功能是否正常工作。 