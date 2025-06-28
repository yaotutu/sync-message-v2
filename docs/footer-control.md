# Footer控制功能使用指南

## 概述

Footer组件支持通过环境变量`NEXT_PUBLIC_HIDE_FOOTER`控制显示/隐藏，隐藏时不会影响页面布局。

## 功能特性

### ✅ 简单的环境变量控制
- 通过环境变量`NEXT_PUBLIC_HIDE_FOOTER`控制显示/隐藏
- 默认为`false`（显示Footer）
- 设置为`true`时隐藏Footer
- Footer隐藏时完全不影响页面布局

## 使用方法

### 环境变量控制

在`.env.local`文件中设置：

```bash
# 隐藏Footer
NEXT_PUBLIC_HIDE_FOOTER=true

# 联系信息（可选）
NEXT_PUBLIC_CONTACT_EMAIL=your@email.com
NEXT_PUBLIC_CONTACT_WECHAT=your-wechat
NEXT_PUBLIC_CONTACT_QQ=123456789
NEXT_PUBLIC_CONTACT_PHONE=13800138000
NEXT_PUBLIC_CONTACT_WEBSITE=https://example.com
NEXT_PUBLIC_CONTACT_COPYRIGHT=© 2024 Your Company
```

## 显示逻辑

- **默认情况**：`NEXT_PUBLIC_HIDE_FOOTER`未设置或为`false`时，显示Footer
- **隐藏Footer**：`NEXT_PUBLIC_HIDE_FOOTER=true`时，隐藏Footer

## 示例

### 隐藏Footer
```bash
# .env.local
NEXT_PUBLIC_HIDE_FOOTER=true
```

### 显示Footer（默认）
```bash
# .env.local
# 不设置NEXT_PUBLIC_HIDE_FOOTER，或设置为false
NEXT_PUBLIC_HIDE_FOOTER=false
```

## 注意事项

1. **环境变量**：变量以`NEXT_PUBLIC_`开头，确保客户端可以访问
2. **重启服务**：修改环境变量后需要重启开发服务器
3. **布局友好**：Footer隐藏时不会影响页面布局，内容会自动填充空间

## 快速使用

### 想要隐藏Footer？
在项目根目录创建或编辑`.env.local`文件：
```bash
NEXT_PUBLIC_HIDE_FOOTER=true
```

### 想要显示Footer？
不设置`NEXT_PUBLIC_HIDE_FOOTER`或设置为`false`：
```bash
NEXT_PUBLIC_HIDE_FOOTER=false
```

然后重启开发服务器即可！ 