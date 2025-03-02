'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getStoredAdminPassword } from '@/lib/services/auth';

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 检查是否已登录
        const password = getStoredAdminPassword();

        // 如果不在登录页面且未登录，则重定向到登录页面
        if (!password && pathname !== '/admin') {
            router.push('/admin');
        }

        setIsLoading(false);
    }, [pathname, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 dark:border-gray-600 border-t-blue-600"></div>
            </div>
        );
    }

    return children;
} 