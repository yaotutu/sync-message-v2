'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    useEffect(() => {
        // 检查登录状态
        const storedAuth = localStorage.getItem('user_auth');
        if (!storedAuth) {
            router.push('/user');
        }
    }, []);

    return <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        {children}
    </div>;
}