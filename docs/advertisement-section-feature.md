# 广告组件功能说明

## 概述
`AdvertisementSection` 组件现在支持根据用户的 `showAds` 设置来控制广告显示。

## 功能特性

### 1. 必填参数
- `cardKey`: 卡密链接key（必填参数）
- 如果未提供 `cardKey`，组件会返回 `null` 并在控制台输出错误信息

### 2. 用户设置检查
- 组件会根据 `cardKey` 查询对应的用户信息
- 检查用户的 `showAds` 字段设置
- 如果 `showAds` 为 `false`，组件不显示任何内容
- 如果 `showAds` 为 `true`，正常显示广告内容

### 3. 错误处理
- 如果查询失败，默认显示广告（向后兼容）
- 在控制台输出详细的错误信息用于调试

## 使用方法

### 在页面中使用
```jsx
import { AdvertisementSection } from './components';

// 传递cardKey参数
<AdvertisementSection cardKey={searchParams.get('cardKey')} />
```

### API端点
```
GET /api/public/user-ads-setting?cardKey=xxx
```

**响应格式：**
```json
{
  "success": true,
  "data": {
    "showAds": true,
    "showFooter": true,
    "username": "用户名"
  }
}
```

## 数据库结构

### User表字段
- `showAds`: Boolean - 控制是否显示广告
- `showFooter`: Boolean - 控制是否显示底部（预留）

### CardLink表关联
- 通过 `cardKey` 查询 `CardLink` 表
- 通过 `username` 关联查询 `User` 表

## 测试

### 运行测试
```bash
node test/test-advertisement-section.js
```

### 测试场景
1. 缺少 `cardKey` 参数
2. 无效的 `cardKey`
3. 有效的 `cardKey` 但用户设置 `showAds: false`
4. 有效的 `cardKey` 且用户设置 `showAds: true`

## 注意事项

1. **性能考虑**: 每次组件加载都会发起API请求，建议后续考虑缓存机制
2. **错误处理**: 网络错误或API错误时默认显示广告，确保向后兼容
3. **安全性**: API端点为公共接口，只返回必要的用户设置信息
4. **向后兼容**: 现有使用方式不受影响，只是增加了新的参数要求 