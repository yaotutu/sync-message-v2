'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuthStatus } from '@/lib/utils/auth';
import { footerControl } from '@/store';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndControlFooter = async () => {
      const { isAuthenticated, isAdmin, username } = getAuthStatus();

      // 认证检查
      if (!isAuthenticated) {
        router.push('/');
        return;
      } else if (!isAdmin) {
        router.push('/user');
        return;
      }

      // 从localStorage获取密码
      let password = '';
      try {
        const storedAuth = localStorage.getItem('user_auth');
        if (storedAuth) {
          const auth = JSON.parse(storedAuth);
          password = auth.password || '';
        }
      } catch (error) {
        console.error('获取密码失败:', error);
      }

      // 确保username和password都存在
      if (!username || !password) {
        console.error('用户名或密码不存在');
        footerControl.show(); // 默认显示
        return;
      }

      // 获取实时用户信息来控制Footer
      try {
        const response = await fetch('/api/user/profile', {
          method: 'GET',
          headers: {
            'x-username': username,
            'x-password': password,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const { showFooter } = result.data;

            // Footer控制逻辑
            if (showFooter === false) {
              footerControl.hide();
            } else {
              footerControl.show();
            }
          }
        } else {
          console.error('获取用户信息失败');
          // 如果获取失败，使用默认显示
          footerControl.show();
        }
      } catch (error) {
        console.error('获取用户信息出错:', error);
        // 如果出错，使用默认显示
        footerControl.show();
      }
    };

    checkAuthAndControlFooter();
  }, [router]);

  return (
    <div className="bg-gray-100 dark:bg-gray-900" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </div>
    </div>
  );
}
