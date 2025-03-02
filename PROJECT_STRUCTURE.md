# 项目结构说明

## 目录结构

```
src/
├── app/                  # Next.js应用目录
│   ├── api/              # API路由
│   │   ├── admin/        # 管理员API (原manage)
│   │   ├── user/         # 用户API
│   │   ├── webhook/      # Webhook API
│   │   └── public/       # 公开API (无需认证)
│   ├── (admin)/          # 管理员页面路由组 (原manage)
│   │   ├── templates/    # 模板管理
│   │   └── users/        # 用户管理
│   ├── (user)/           # 用户页面路由组
│   │   ├── cardlinks/    # 卡密链接管理
│   │   └── messages/     # 消息查看
│   └── (public)/         # 公开页面路由组
│       └── view/         # 消息查看页面
├── components/           # 共享组件
│   ├── admin/            # 管理员组件
│   ├── user/             # 用户组件
│   └── ui/               # 通用UI组件
├── lib/                  # 工具和服务
│   ├── db/               # 数据库相关
│   │   ├── index.ts      # 数据库连接
│   │   ├── init.ts       # 数据库初始化
│   │   ├── users.ts      # 用户数据操作
│   │   ├── messages.ts   # 消息数据操作
│   │   ├── templates.ts  # 模板数据操作
│   │   └── cardlinks.ts  # 卡密链接数据操作
│   ├── auth/             # 认证相关
│   │   ├── admin.ts      # 管理员认证
│   │   └── user.ts       # 用户认证
│   └── services/         # 业务服务
│       ├── messages.ts   # 消息服务
│       ├── templates.ts  # 模板服务
│       └── cardlinks.ts  # 卡密链接服务
└── types/                # TypeScript类型
    ├── user.ts           # 用户类型
    ├── messages.ts       # 消息类型
    ├── templates.ts      # 模板类型
    └── cardlinks.ts      # 卡密链接类型
```

## API路由结构

### 管理员API

- `/api/admin/login` - 管理员登录
- `/api/admin/users` - 用户管理
- `/api/admin/templates` - 模板管理
- `/api/admin/templates/[id]` - 单个模板管理
- `/api/admin/templates/[id]/rules` - 模板规则管理

### 用户API

- `/api/user/login` - 用户登录
- `/api/user/messages` - 用户消息
- `/api/user/cardkeys` - 用户卡密
- `/api/user/cardlinks` - 用户卡密链接

### Webhook API

- `/api/webhook` - 接收消息
- `/api/webhook/login` - Webhook登录

### 公开API

- `/api/public/messages` - 公开消息查询 (通过卡密链接)
- `/api/cardkey/validate` - 卡密验证

## 页面路由结构

### 管理员页面

- `/admin` - 管理员首页
- `/admin/users` - 用户管理页面
- `/admin/templates` - 模板管理页面

### 用户页面

- `/user` - 用户首页
- `/user/cardlinks` - 卡密链接管理页面
- `/user/messages` - 消息查看页面

### 公开页面

- `/view` - 消息查看页面 (通过卡密链接)

## 数据模型

### 用户 (webhook_users)

- `id` - 用户ID
- `username` - 用户名
- `password` - 密码
- `webhook_key` - Webhook密钥
- `created_at` - 创建时间

### 消息 (messages)

- `id` - 消息ID
- `username` - 用户名
- `sms_content` - 消息内容
- `rec_time` - 接收时间
- `received_at` - 接收时间戳

### 模板 (templates)

- `id` - 模板ID
- `name` - 模板名称
- `description` - 模板描述
- `created_at` - 创建时间
- `updated_at` - 更新时间

### 规则 (rules)

- `id` - 规则ID
- `template_id` - 模板ID
- `type` - 规则类型 (include/exclude)
- `mode` - 规则模式 (simple_include/simple_exclude/regex)
- `pattern` - 规则模式
- `description` - 规则描述
- `order_num` - 规则顺序
- `is_active` - 规则是否激活

### 卡密链接 (card_links)

- `id` - 卡密链接ID
- `key` - 卡密
- `username` - 用户名
- `app_name` - 应用名称
- `phones` - 手机号列表
- `created_at` - 创建时间
- `url` - 生成的URL 