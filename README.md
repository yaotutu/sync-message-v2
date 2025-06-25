* 项目初始化
  * npm install  // 安装依赖
  * npx prisma migrate dev // 初始化数据库
  * 拷贝 .env.example 到 .env 并修改配置
  * npm run dev // 启动项目

## 启动端口说明
- 默认端口为 3000。
- 可通过设置环境变量 PORT 来自定义端口。
- 例如：

```bash
# 使用默认端口 3000
npm run dev

# 使用自定义端口 8080
PORT=8080 npm run dev
```

Next.js 会自动识别 PORT 环境变量，无需额外配置。

## PM2 部署管理

### 安装 PM2
```bash
npm install -g pm2
```

### 构建项目
```bash
npm run build
```

### 环境变量配置
PM2 会自动加载项目根目录下的 `.env` 文件。确保你的 `.env` 文件包含必要的环境变量：

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，配置必要的环境变量
# 例如：DATABASE_URL, ADMIN_PASSWORD 等
```

### 使用 PM2 启动项目

#### 开发环境
```bash
# 启动开发环境
pm2 start ecosystem.config.js

# 启动开发环境并指定端口
PORT=8080 pm2 start ecosystem.config.js
```

#### 生产环境
```bash
# 启动生产环境
pm2 start ecosystem.config.js --env production

# 启动生产环境并指定端口
PORT=8080 pm2 start ecosystem.config.js --env production
```

### PM2 常用命令
```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs sync-message-v2

# 重启应用
pm2 restart sync-message-v2

# 停止应用
pm2 stop sync-message-v2

# 删除应用
pm2 delete sync-message-v2

# 监控应用
pm2 monit
```

### 自定义端口
可以通过环境变量设置端口：
```bash
# 设置端口为 8080
PORT=8080 pm2 start ecosystem.config.js

# 或者修改 ecosystem.config.js 中的 PORT 值
```

### 环境变量优先级
PM2 加载环境变量的优先级（从高到低）：
1. 命令行传入的环境变量：`PORT=8080 pm2 start ecosystem.config.js`
2. `ecosystem.config.js` 中 `env` 或 `env_production` 配置的环境变量
3. `.env` 文件中的环境变量
4. 系统环境变量

### 日志文件
PM2 会将日志输出到以下文件：
- `./logs/out.log` - 标准输出日志
- `./logs/err.log` - 错误日志  
- `./logs/combined.log` - 合并日志