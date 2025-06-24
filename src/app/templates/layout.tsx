'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthStatus } from '@/lib/utils/auth';
import { Alert, Box } from '@mui/material';

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
      <Box sx={{ p: 3 }}>
        <Alert severity="error">无模版管理权限，请联系管理员</Alert>
      </Box>
    );
  }

  return <div className="min-h-screen bg-gray-100 dark:bg-gray-900">{children}</div>;
}
