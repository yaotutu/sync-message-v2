# 类型转换重构总结

## 问题背景

在开发过程中，经常遇到BigInt、字符串和数字类型混合运算的问题，特别是在处理数据库时间戳字段时。这导致：

1. **代码重复**：每个文件都需要实现类似的类型转换逻辑
2. **维护困难**：类型转换逻辑分散在各个文件中
3. **错误频发**：BigInt与Number混合运算导致运行时错误

## 解决方案

创建了统一的类型转换工具函数库：`src/lib/utils/type-conversion.js`

### 核心函数

#### 1. 基础类型转换
- `safeToNumber(value, defaultValue)` - 安全转换为数字
- `safeToString(value, defaultValue)` - 安全转换为字符串  
- `safeToBoolean(value, defaultValue)` - 安全转换为布尔值

#### 2. 时间相关函数
- `checkExpiration(firstUsedAt, expiryDays)` - 检查是否过期
- `calculateExpiryTime(firstUsedAt, expiryDays)` - 计算过期时间
- `calculateRemainingDays(firstUsedAt, expiryDays)` - 计算剩余天数
- `formatTimestamp(timestamp, locale)` - 格式化时间戳
- `getCurrentTimestamp()` - 获取当前时间戳
- `getTimestampAfterDays(days)` - 获取指定天数后的时间戳
- `getTimestampBeforeDays(days)` - 获取指定天数前的时间戳

### 支持的数据类型

- **BigInt类型**：自动转换为Number
- **字符串类型**：自动转换为Number（支持数字字符串）
- **数字类型**：直接使用
- **null/undefined**：返回默认值

## 重构前后对比

### 重构前
```javascript
// 每个文件都需要实现类似的逻辑
function checkExpiration(firstUsedAt, expiryDays) {
    const firstUsedAtNum = typeof firstUsedAt === 'bigint' ? Number(firstUsedAt) : 
                          typeof firstUsedAt === 'string' ? parseInt(firstUsedAt, 10) : 
                          firstUsedAt;
    const expiryDaysNum = typeof expiryDays === 'bigint' ? Number(expiryDays) : 
                         typeof expiryDays === 'string' ? parseInt(expiryDays, 10) : 
                         expiryDays;
    // ... 计算逻辑
}
```

### 重构后
```javascript
// 统一导入，简洁使用
import { checkExpiration } from '@/lib/utils/type-conversion.js';

const isExpired = checkExpiration(cardLink.firstUsedAt, cardLink.expiryDays);
```

## 应用场景

### 1. API层面
```javascript
// src/app/api/public/messages/route.js
import { checkExpiration } from '@/lib/utils/type-conversion.js';

const isExpired = checkExpiration(cardLink.firstUsedAt, cardLink.expiryDays);
```

### 2. 前端页面
```javascript
// src/app/view/page.jsx
import { calculateExpiryTime, formatTimestamp } from '@/lib/utils/type-conversion.js';

const expiryTime = calculateExpiryTime(firstUsedAt, data.expiryDays);
const formattedTime = formatTimestamp(expiryTime);
```

### 3. 数据库操作
```javascript
// 任何需要处理时间戳的地方
import { safeToNumber, formatTimestamp } from '@/lib/utils/type-conversion.js';

const timestamp = safeToNumber(dbRecord.timestamp);
const displayTime = formatTimestamp(timestamp);
```

## 测试验证

创建了完整的测试套件：

- `test/test-type-conversion-utils.js` - 工具函数测试
- `test/test-bigint-conversion.js` - BigInt转换测试
- `test/test-expiration-feature.js` - 过期功能测试

所有测试用例通过，确保功能正确性。

## 优势

1. **代码复用**：避免重复实现类型转换逻辑
2. **类型安全**：统一处理BigInt、字符串、数字类型
3. **易于维护**：集中管理类型转换逻辑
4. **测试覆盖**：完整的测试用例确保功能正确
5. **文档完善**：详细的JSDoc注释和使用示例

## 使用建议

1. **新功能开发**：优先使用统一的工具函数
2. **代码重构**：逐步替换现有的类型转换逻辑
3. **测试验证**：确保类型转换的正确性
4. **文档更新**：及时更新相关文档

## 未来扩展

可以根据需要添加更多类型转换函数：

- 数组类型转换
- 对象类型转换
- 日期类型转换
- 自定义验证规则

这个重构解决了BigInt类型转换的常见问题，提高了代码质量和可维护性。 