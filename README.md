# 短信验证码管理系统

## 项目概述

这是一个基于 Next.js 和 TypeScript 开发的短信验证码管理系统，用于管理和过滤不同应用的短信验证码。系统支持多应用模板管理，基于规则的消息匹配，以及灵活的验证码提取逻辑。

### 技术栈

- 框架：Next.js
- 前端：React + TypeScript
- 样式：Tailwind CSS
- 认证：基于单一管理员密码的认证系统

## API 接口文档

### 用户相关接口

#### 1. 用户管理 API (`/api/user/`)
- `POST /api/user/create` - 创建新用户
  - 请求体：`{ username: string }`
  - 响应：`{ success: boolean, data: User }`

#### 2. 卡密管理 API (`/api/admin/`)
- `POST /api/admin/create-card` - 创建卡密
  - 请求体：`{ username: string, expiresIn?: number }`
  - 响应：`{ success: boolean, data: CardKey }`

- `GET /api/admin/cards` - 获取卡密列表
  - 响应：`{ success: boolean, data: CardKey[] }`

#### 3. 卡链接管理 API
- `POST /api/user/create-link` - 创建卡链接
  - 请求体：`CreateCardLinkDTO`
  - 响应：`{ success: boolean, data: CardLink }`

#### 4. 消息查询 API
- `GET /api/get-messages` - 获取消息列表
  - 查询参数：`username`, `key`
  - 响应：`MessageResponse`

#### 5. 模板管理 API
- `GET /api/admin/templates` - 获取所有模板
- `POST /api/admin/templates` - 创建新模板
- `PUT /api/admin/templates/:id` - 更新模板
- `DELETE /api/admin/templates/:id` - 删除模板

### 规则管理 API
- `POST /api/admin/templates/:id/rules` - 添加规则
- `PUT /api/admin/templates/:id/rules/:ruleId` - 更新规则
- `DELETE /api/admin/templates/:id/rules/:ruleId` - 删除规则

## 页面交互逻辑

### 1. 首页 (`/`)
- 展示系统概览
- 提供快速导航到管理页面和用户页面

### 2. 管理员页面 (`/admin`)
- 管理员登录
- 卡密管理
  - 创建卡密
  - 查看卡密列表
  - 管理卡密状态
- 模板管理
  - 创建/编辑应用模板
  - 配置规则
  - 管理规则优先级

### 3. 用户页面 (`/user`)
- 卡密验证
- 创建卡链接
- 查看消息记录

### 4. 查看页面 (`/view`)
- 公开访问的消息查看页面
- 基于卡链接展示过滤后的消息

## 数据结构

### 应用模板 (AppTemplate)
```typescript
{
    id: string;
    name: string;
    description: string;
    rules: TemplateRule[];
    createdAt: string;
    updatedAt: string;
}
```

### 模板规则 (TemplateRule)
```typescript
{
    id: string;
    order_num: number;
    type: 'include' | 'exclude';
    mode: 'simple_include' | 'simple_exclude' | 'regex';
    pattern: string;
    description: string;
    isActive: boolean;
}
```

### 卡链接 (CardLink)
```typescript
{
    id: string;
    key: string;
    username: string;
    appName: string;
    phones: string[];
    createdAt: number;
    firstUsedAt?: number;
    url: string;
    templateId?: string;
}
```

## 认证机制

系统使用基于单一管理员密码的认证机制：
- 管理员密码存储在 localStorage 中
- API 请求通过 `x-admin-password` header 进行认证
- 未认证请求返回 401 错误码

## 开发指南

### 项目结构
- `src/app` - Next.js 应用目录
- `src/app/api` - API 路由
- `src/app/admin` - 管理后台
- `src/types` - TypeScript 类型定义
- `src/lib` - 工具和服务
- `src/components` - React 组件

### 开发规范
1. 使用函数式组件和 React Hooks
2. 使用 Tailwind CSS 进行样式开发
3. 严格遵循 TypeScript 类型定义
4. 保持代码简洁，避免过度工程化 