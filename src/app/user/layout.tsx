'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthStatus } from '@/lib/utils/auth';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const { isAuthenticated, isAdmin } = getAuthStatus();
    if (!isAuthenticated) {
      router.push('/');
    } else if (isAdmin) {
      router.push('/admin');
    }
  }, [router]);

  return (
    <div className="bg-gray-100 dark:bg-gray-900" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </div>
    </div>
  );
}
