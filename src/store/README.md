# Store 状态管理

这个文件夹包含了项目中的所有状态管理文件，使用 Zustand 进行状态管理。

## 文件结构

```
src/store/
├── index.js          # 统一导出入口
├── footer.js         # Footer状态管理
└── README.md         # 说明文档
```

## Footer状态管理

Footer的显示与隐藏通过状态管理控制，支持以下功能：

### 1. 导入状态管理

```javascript
// 方式1：从统一入口导入
import { footerControl, useFooterStore } from '@/store';

// 方式2：直接从具体文件导入
import { footerControl, useFooterStore } from '@/store/footer';
```

### 2. 使用控制函数

```javascript
// 在任何地方调用控制函数
footerControl.show();      // 显示Footer
footerControl.hide();      // 隐藏Footer
footerControl.toggle();    // 切换Footer
footerControl.setVisible(false);  // 设置特定状态
const isVisible = footerControl.getVisible();  // 获取当前状态
```

### 3. 在组件中使用Hook

```javascript
function MyComponent() {
  const { visible, show, hide, toggle } = useFooterStore();
  
  return (
    <div>
      <p>Footer状态: {visible ? '显示' : '隐藏'}</p>
      <button onClick={show}>显示</button>
      <button onClick={hide}>隐藏</button>
      <button onClick={toggle}>切换</button>
    </div>
  );
}
```

### 4. Footer控制逻辑

Footer的显示与隐藏采用多层控制架构：

1. **路由控制**：`/view` 开头的页面自动隐藏Footer
2. **全局状态控制**：通过 `footerControl` 函数动态控制
3. **最终显示**：路由控制 + 全局状态的综合结果

## 添加新的状态管理

### 1. 创建新的状态文件

```javascript
// src/store/user.js
import { create } from 'zustand';

const useUserStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));

export const userControl = {
  setUser: (user) => useUserStore.getState().setUser(user),
  clearUser: () => useUserStore.getState().clearUser(),
  getUser: () => useUserStore.getState().user,
};

export { useUserStore };
```

### 2. 在index.js中导出

```javascript
// src/store/index.js
export { useFooterStore, footerControl } from './footer';
export { useUserStore, userControl } from './user';  // 新增
```

### 3. 使用新的状态管理

```javascript
import { userControl, useUserStore } from '@/store';

// 使用控制函数
userControl.setUser(userData);

// 使用Hook
const { user } = useUserStore();
```

## 最佳实践

1. **命名规范**：状态文件使用小写，如 `footer.js`、`user.js`
2. **导出规范**：每个状态文件导出 `useXXXStore` Hook 和 `xxxControl` 控制函数
3. **统一入口**：通过 `index.js` 统一导出所有状态管理
4. **类型安全**：建议使用 TypeScript 定义状态类型
5. **性能优化**：使用 Zustand 的选择器避免不必要的重渲染 