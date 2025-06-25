'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthStatus } from '@/lib/utils/auth';
import Footer from '@/components/Footer';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const { isAuthenticated, isAdmin } = getAuthStatus();
    if (!isAuthenticated) {
      router.push('/');
    } else if (!isAdmin) {
      router.push('/user');
    }
  }, [router]);

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </div>
      <Footer />
    </div>
  );
}
