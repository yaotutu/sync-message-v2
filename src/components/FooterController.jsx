'use client';

import { usePathname } from 'next/navigation';
import { useFooterStore } from '@/store';
import Footer from './Footer';

export default function FooterController() {
    const pathname = usePathname();
    const { visible } = useFooterStore();

    // 路由控制：view页面隐藏Footer
    const routeShouldShow = !pathname.startsWith('/view');

    // 综合判断：路由控制 + 全局状态控制
    const shouldShow = routeShouldShow && visible;

    return <Footer visible={true} />;
} 