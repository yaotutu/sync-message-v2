# 项目重构迁移计划

本文档提供了将当前项目结构重构为新结构的分步计划。

## 阶段一: 准备工作

1. **创建新的目录结构**
   - 创建 `src/lib/services` 目录
   - 创建 `src/lib/auth` 目录
   - 创建 `src/components` 目录及子目录

2. **创建新的API路由目录**
   - 创建 `src/app/api/admin` 目录
   - 创建 `src/app/api/public` 目录

## 阶段二: 服务层重构

1. **创建服务层**
   - 创建 `src/lib/services/messages.ts` (已完成)
   - 创建 `src/lib/services/templates.ts`
   - 创建 `src/lib/services/cardlinks.ts`

2. **重构认证逻辑**
   - 创建 `src/lib/auth/admin.ts`
   - 创建 `src/lib/auth/user.ts`

## 阶段三: API路由迁移

1. **迁移管理员API**
   - 将 `/api/manage/login` 迁移到 `/api/admin/login`
   - 将 `/api/manage/users` 迁移到 `/api/admin/users`
   - 将 `/api/manage/templates` 迁移到 `/api/admin/templates`
   - 将 `/api/manage/templates/[id]` 迁移到 `/api/admin/templates/[id]`
   - 将 `/api/manage/templates/[id]/rules` 迁移到 `/api/admin/templates/[id]/rules`

2. **迁移公共API**
   - 创建 `/api/public/messages` (已完成)
   - 将 `/api/cardkey/validate` 迁移到 `/api/public/validate`

3. **添加重定向**
   - 为所有旧路径添加重定向到新路径 (已部分完成)

## 阶段四: 页面路由迁移

1. **迁移管理员页面**
   - 将 `/manage` 迁移到 `/admin`
   - 将 `/manage/users` 迁移到 `/admin/users`
   - 将 `/manage/templates` 迁移到 `/admin/templates`

2. **迁移用户页面**
   - 将用户相关页面迁移到 `/user` 目录下

## 阶段五: 组件重构

1. **提取共享组件**
   - 将重复的UI元素提取为共享组件
   - 将管理员认证组件移动到 `components/admin`

## 阶段六: 测试与优化

1. **测试所有功能**
   - 测试所有API路由
   - 测试所有页面功能
   - 测试认证流程

2. **性能优化**
   - 优化数据库查询
   - 添加适当的缓存
   - 优化前端加载性能

## 迁移注意事项

1. **保持向后兼容**
   - 所有旧路径应该重定向到新路径
   - 保持API响应格式一致

2. **数据库兼容性**
   - 不修改数据库表结构
   - 确保所有查询兼容现有数据

3. **分步实施**
   - 每个阶段完成后进行测试
   - 发现问题及时修复后再进行下一步

## 已完成的迁移

- ✅ 创建 `src/lib/services/messages.ts`
- ✅ 创建 `src/app/api/public/messages/route.ts`
- ✅ 添加旧路径 `/api/view/messages` 到新路径的重定向
- ✅ 更新 `src/app/view/page.tsx` 使用新的API路由 