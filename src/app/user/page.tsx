'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/utils/auth';
import { userApi } from '@/lib/utils/api-client';
import NavigationCard from '@/components/NavigationCard';
import ConfigDialog from '@/components/ConfigDialog';
import { Button, Box } from '@mui/material';
import { Settings } from '@mui/icons-material';

interface User {
  id: number;
  username: string;
  webhookKey?: string;
  createdAt?: string;
  canManageTemplates?: boolean;
  expiryDate?: string;
  cardLinkTags?: string[];
  showFooter?: boolean;
  showAds?: boolean;
}

export default function UserPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [configDialogOpen, setConfigDialogOpen] = useState(false);

  useEffect(() => {
    // 加载用户数据
    const loadUserData = async () => {
      setLoading(true);
      setError('');

      try {
        const response = await userApi.get('/api/user/profile');

        if (response.success) {
          setUser(response.data);
        } else {
          setError(response.message || '获取用户信息失败');
          // 如果认证失败，跳转到登录页面
          if (response.message?.includes('认证') || response.message?.includes('用户名或密码')) {
            logout();
            router.push('/');
            return;
          }
        }
      } catch (err) {
        console.error('获取用户信息失败:', err);
        setError('获取用户信息失败，请检查网络连接');
        // 如果网络错误，可能是认证问题，跳转到登录页面
        logout();
        router.push('/');
        return;
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleOpenConfig = () => {
    setConfigDialogOpen(true);
  };

  const handleCloseConfig = () => {
    setConfigDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 py-8 px-4" style={{ height: '100%' }}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-100 dark:bg-gray-900 py-8 px-4" style={{ height: '100%' }}>
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">加载失败</h2>
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              >
                重新加载
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 dark:bg-gray-900 py-8 px-4" style={{ height: '100%' }}>
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* 页面头部 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">用户中心</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all"
                >
                  退出登录
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all"
                >
                  返回首页
                </button>
              </div>
            </div>
            {/* 用户信息 */}
            <div className="space-y-2">
              <p className="text-gray-700 dark:text-gray-300">
                <span className="font-medium">用户名:</span> {user?.username}
              </p>
              {user?.webhookKey && (
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">Webhook密钥:</span> {user.webhookKey}
                </p>
              )}
              {user?.createdAt && (
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">创建时间:</span> {new Date(Number(user.createdAt)).toLocaleString()}
                </p>
              )}
              {user?.canManageTemplates && (
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="font-medium">权限:</span>
                  <span className="text-green-600 dark:text-green-400 ml-1">模板管理</span>
                </p>
              )}
            </div>
          </div>

          {/* 配置文件区域 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">短信转发器配置</h3>
              <Button
                variant="contained"
                color="primary"
                startIcon={<Settings />}
                onClick={handleOpenConfig}
                sx={{
                  backgroundColor: '#1976d2',
                  '&:hover': {
                    backgroundColor: '#1565c0'
                  }
                }}
              >
                查看配置文件
              </Button>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              点击上方按钮查看您的短信转发器配置文件。配置文件包含用户名、Webhook密钥等信息，需要复制到您的设备中使用。
            </p>
          </div>

          {/* 功能导航卡片 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">功能导航</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NavigationCard
                href="/user/cardlinks"
                title="卡密链接管理"
                description="创建和管理带有链接的卡密，用于短信验证码过滤"
                colorTheme="blue"
                randomColor={false}
                className=""
                disabled={false}
              />
              <NavigationCard
                href="/user/messages"
                title="我的消息"
                description="查看和管理所有收到的短信消息"
                colorTheme="green"
                randomColor={false}
                className=""
                disabled={false}
              />
              <NavigationCard
                href="/templates"
                title="应用模版"
                description={user?.canManageTemplates
                  ? "查看和管理应用模版"
                  : "请联系管理员开通该权限"
                }
                colorTheme="purple"
                randomColor={false}
                className=""
                disabled={!user?.canManageTemplates}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 配置文件对话框 */}
      <ConfigDialog
        open={configDialogOpen}
        onClose={handleCloseConfig}
      />
    </div>
  );
}
