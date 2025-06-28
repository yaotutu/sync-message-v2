# View页面组件结构

## 概述
View页面已被拆分为多个独立的组件，以提高代码的可维护性和可复用性。

## 组件结构

### 主要组件
- **ViewPageContent** - 主内容组件，负责状态管理和业务逻辑
- **MessageContent** - 消息内容容器，包含手机号和验证码部分

### 功能组件
- **HeaderCard** - 标题卡片，显示应用名称和相关信息
- **PhoneSection** - 手机号部分，包含复制功能
- **CodeSection** - 验证码部分，包含复制功能和加载状态
- **AdvertisementSection** - 广告组件

### 状态组件
- **LoadingState** - 加载状态显示
- **ErrorState** - 错误状态显示（包括过期状态）
- **EmptyState** - 空状态显示
- **CodeDialog** - 验证码弹窗

### 工具函数
- **messageUtils.js** - 消息相关的工具函数
  - `extractVerificationCode()` - 提取验证码
  - `fetchMessageData()` - 获取消息数据

## 文件结构
```
src/app/view/
├── page.jsx                    # 主页面
├── components/                 # 组件目录
│   ├── index.js               # 组件索引
│   ├── AdvertisementSection.jsx
│   ├── HeaderCard.jsx
│   ├── MessageContent.jsx
│   ├── PhoneSection.jsx
│   ├── CodeSection.jsx
│   ├── CodeDialog.jsx
│   ├── LoadingState.jsx
│   ├── ErrorState.jsx
│   └── EmptyState.jsx
└── utils/                     # 工具函数目录
    └── messageUtils.js
```

## 使用方式
```javascript
// 从组件索引导入
import {
    AdvertisementSection,
    HeaderCard,
    MessageContent,
    CodeDialog,
    LoadingState,
    ErrorState,
    EmptyState
} from './components';

// 从工具函数导入
import { extractVerificationCode, fetchMessageData } from './utils/messageUtils';
```

## 组件职责

### ViewPageContent
- 管理页面状态（loading, error, data）
- 处理数据获取和轮询逻辑
- 处理复制功能
- 渲染不同状态的组件

### MessageContent
- 组合手机号和验证码部分
- 传递复制相关的props

### HeaderCard
- 显示应用名称
- 显示时间信息（首次使用时间、验证码到达时间）
- 显示有效期信息

### PhoneSection/CodeSection
- 显示具体内容
- 处理复制功能
- 显示操作提示

### 状态组件
- 专注于显示特定状态的UI
- 可复用于其他页面

## 优势
1. **可维护性** - 每个组件职责单一，易于理解和修改
2. **可复用性** - 状态组件可以在其他页面复用
3. **可测试性** - 每个组件可以独立测试
4. **可读性** - 代码结构清晰，易于阅读 