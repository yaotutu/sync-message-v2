# 消息同步管理系统文档

## 项目概述

消息同步管理系统是一个用于管理和同步消息的平台，支持应用模板管理、用户管理、卡密管理等功能。系统采用Next.js框架开发，使用TypeScript语言，UI采用Tailwind CSS实现。

## 技术栈

- **前端框架**: Next.js
- **编程语言**: TypeScript
- **样式**: Tailwind CSS
- **数据库**: SQLite
- **API**: RESTful API

## 页面结构

### 1. 首页 (`/`)

- **功能**: 系统入口页面，提供管理员后台和用户中心的入口链接
- **组件**: `src/app/page.tsx`

### 2. 管理员页面

#### 2.1 管理员登录 (`/admin`)

- **功能**: 管理员登录页面，验证管理员密码
- **组件**: `src/app/admin/page.tsx`
- **API**: `POST /api/admin/login`

#### 2.2 用户管理 (`/admin/users`)

- **功能**: 管理系统用户，包括添加、删除用户等操作
- **组件**: `src/app/admin/users/page.tsx`
- **API**: 
  - `GET /api/admin/users` - 获取用户列表
  - `POST /api/admin/users` - 添加新用户
  - `DELETE /api/admin/users/[username]` - 删除用户

#### 2.3 模板管理 (`/admin/templates`)

- **功能**: 管理消息模板，自定义消息格式和样式
- **组件**: `src/app/admin/templates/page.tsx`
- **API**: 
  - `GET /api/admin/templates` - 获取模板列表
  - `POST /api/admin/templates` - 创建新模板
  - `PATCH /api/admin/templates/[id]` - 更新模板
  - `DELETE /api/admin/templates/[id]` - 删除模板
  - `POST /api/admin/templates/[id]/rules` - 添加规则
  - `DELETE /api/admin/templates/[id]/rules` - 删除规则

### 3. 用户页面

#### 3.1 用户中心 (`/user`)

- **功能**: 用户登录、查看卡密、生成卡链接等
- **组件**: `src/app/user/page.tsx`
- **API**: 
  - `POST /api/user/login` - 用户登录
  - `GET /api/user/cardkeys` - 获取卡密列表
  - `POST /api/user/cardkeys` - 生成新卡密

#### 3.2 卡链接管理 (`/user/cardlinks`)

- **功能**: 管理卡链接，包括创建、查看卡链接等
- **组件**: `src/app/user/cardlinks/page.tsx`
- **API**: 
  - `GET /api/user/cardlinks` - 获取卡链接列表
  - `POST /api/user/cardlinks` - 创建新卡链接

### 4. 查看页面 (`/view`)

- **功能**: 查看消息内容，根据卡密和应用名称过滤消息
- **组件**: `src/app/view/page.tsx`
- **API**: `GET /api/public/messages` - 获取过滤后的消息

## API结构

### 1. 管理员API

#### 1.1 登录

- `POST /api/admin/login` - 管理员登录

#### 1.2 用户管理

- `GET /api/admin/users` - 获取用户列表
- `POST /api/admin/users` - 添加新用户
- `GET /api/admin/users/[username]` - 获取单个用户
- `DELETE /api/admin/users/[username]` - 删除用户

#### 1.3 模板管理

- `GET /api/admin/templates` - 获取模板列表
- `POST /api/admin/templates` - 创建新模板
- `GET /api/admin/templates/[id]` - 获取单个模板
- `PATCH /api/admin/templates/[id]` - 更新模板
- `DELETE /api/admin/templates/[id]` - 删除模板
- `POST /api/admin/templates/[id]/rules` - 添加规则
- `DELETE /api/admin/templates/[id]/rules` - 删除规则

### 2. 用户API

#### 2.1 登录

- `POST /api/user/login` - 用户登录

#### 2.2 卡密管理

- `GET /api/user/cardkeys` - 获取卡密列表
- `POST /api/user/cardkeys` - 生成新卡密

#### 2.3 卡链接管理

- `GET /api/user/cardlinks` - 获取卡链接列表
- `POST /api/user/cardlinks` - 创建新卡链接

#### 2.4 消息管理

- `GET /api/user/messages` - 获取用户消息

### 3. 公共API

#### 3.1 消息

- `GET /api/public/messages` - 获取过滤后的消息

#### 3.2 模板

- `GET /api/public/templates` - 获取所有模板
- `GET /api/public/templates/[name]` - 根据名称获取模板
- `GET /api/public/templates/names` - 获取所有模板名称

### 4. Webhook API

- `POST /api/webhook` - 接收消息
- `POST /api/webhook/login` - Webhook登录

## 数据库结构

### 1. 用户表 (`webhook_users`)

- `id`: 自增ID
- `username`: 用户名
- `password`: 密码
- `webhook_key`: Webhook密钥
- `created_at`: 创建时间

### 2. 消息表 (`messages`)

- `id`: 自增ID
- `username`: 用户名
- `sms_content`: 短信内容
- `rec_time`: 接收时间
- `received_at`: 系统接收时间

### 3. 卡密表 (`card_keys`)

- `id`: 自增ID
- `key`: 卡密
- `username`: 用户名
- `status`: 状态（unused/used）
- `created_at`: 创建时间
- `used_at`: 使用时间

### 4. 模板表 (`templates`)

- `id`: 模板ID
- `name`: 模板名称
- `description`: 模板描述
- `created_at`: 创建时间
- `updated_at`: 更新时间

### 5. 规则表 (`rules`)

- `id`: 规则ID
- `template_id`: 关联的模板ID
- `type`: 规则类型（include/exclude）
- `mode`: 规则模式（simple_include/simple_exclude/regex）
- `pattern`: 匹配模式
- `description`: 规则描述
- `order_num`: 规则优先级
- `is_active`: 是否启用

### 6. 卡链接表 (`card_links`)

- `id`: 卡链接ID
- `key`: 卡密
- `username`: 用户名
- `app_name`: 应用名称
- `phones`: 手机号列表
- `created_at`: 创建时间
- `url`: 生成的URL
- `template_id`: 关联的模板ID

## 服务层结构

### 1. 认证服务 (`src/lib/services/auth.ts`)

- 管理员密码验证
- 用户认证

### 2. 用户服务 (`src/lib/services/users.ts`)

- 用户创建、删除
- 用户验证

### 3. 消息服务 (`src/lib/services/messages.ts`)

- 消息添加
- 消息过滤

### 4. 模板服务 (`src/lib/services/templates.ts`)

- 模板创建、更新、删除
- 规则管理

### 5. 卡链接服务 (`src/lib/services/cardlinks.ts`)

- 卡链接创建
- 卡链接查询

## 类型定义

所有类型定义都集中在 `src/types/index.ts` 文件中，包括：

- `ApiResponse`: API响应类型
- `User`: 用户类型
- `CardKey`: 卡密类型
- `CardLink`: 卡链接类型
- `Message`: 消息类型
- `AppTemplate`: 应用模板类型
- `TemplateRule`: 模板规则类型

## 项目迁移说明

项目已经完成了从旧结构到新结构的迁移，主要变化包括：

1. 将 `/manage` 路径迁移到 `/admin` 路径
2. 将 `/api/manage` 路径迁移到 `/api/admin` 路径
3. 添加了重定向逻辑，确保旧路径可以正确重定向到新路径
4. 统一了类型定义，删除了冗余的类型文件
5. 优化了服务层结构，提高了代码复用性 