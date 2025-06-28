'use client';

import { create } from 'zustand';

// Footer状态管理
const useFooterStore = create((set) => ({
    visible: true,
    setVisible: (visible) => set({ visible }),
    hide: () => set({ visible: false }),
    show: () => set({ visible: true }),
    toggle: () => set((state) => ({ visible: !state.visible })),
}));

// 导出控制函数
export const footerControl = {
    // 显示Footer
    show: () => useFooterStore.getState().show(),

    // 隐藏Footer
    hide: () => useFooterStore.getState().hide(),

    // 切换Footer显示状态
    toggle: () => useFooterStore.getState().toggle(),

    // 设置Footer显示状态
    setVisible: (visible) => useFooterStore.getState().setVisible(visible),

    // 获取当前Footer状态
    getVisible: () => useFooterStore.getState().visible,
};

// 导出Hook（用于组件中获取状态）
export { useFooterStore }; 