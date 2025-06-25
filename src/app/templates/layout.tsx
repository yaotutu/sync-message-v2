'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthStatus } from '@/lib/utils/auth';
import { Alert, Box } from '@mui/material';
import Footer from '@/components/Footer';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [hasTemplateAccess, setHasTemplateAccess] = useState(true);

  useEffect(() => {
    const authStatus = getAuthStatus();

    if (!authStatus.isAuthenticated) {
      router.push('/');
      return;
    }

    if (!authStatus.canManageTemplates) {
      setHasTemplateAccess(false);
    }
  }, [router]);

  if (!hasTemplateAccess) {
    return (
      <div className="h-screen bg-gray-100 dark:bg-gray-900" style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Box sx={{ p: 3 }}>
            <Alert severity="error">无模版管理权限，请联系管理员</Alert>
          </Box>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </div>
      <Footer />
    </div>
  );
}
