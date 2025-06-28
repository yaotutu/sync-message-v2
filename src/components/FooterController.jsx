'use client';

import { usePathname } from 'next/navigation';
import Footer from './Footer';

export default function FooterController() {
    const pathname = usePathname();

    // view页面隐藏Footer
    const shouldShow = !pathname.startsWith('/view');

    return <Footer visible={shouldShow} />;
} 