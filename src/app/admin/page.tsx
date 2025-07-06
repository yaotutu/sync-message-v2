'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/utils/auth';
import NavigationCard from '@/components/NavigationCard';

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟加载延迟
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    logout();
    router.push('/');
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

  return (
    <div className="bg-gray-100 dark:bg-gray-900 py-8 px-4" style={{ height: '100%' }}>
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* 页面头部 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">管理后台</h2>
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
          </div>

          {/* 功能导航卡片 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">功能导航</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NavigationCard
                href="/admin/users"
                title="用户管理"
                description="管理系统用户，包括添加、删除用户等操作"
                colorTheme="blue"
                randomColor={false}
                className=""
                disabled={false}
              />
              {/* <NavigationCard
                href="/templates"
                title="模板管理"
                description="管理消息模板，自定义消息格式和样式"
                colorTheme="green"
                randomColor={false}
                className=""
              /> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
