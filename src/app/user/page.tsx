'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import NavigationCard from '@/components/NavigationCard';

interface User {
  username: string;
  webhookKey?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function UserPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 模拟加载用户数据
    const loadUserData = async () => {
      setLoading(true);

      // 模拟API调用延迟
      setTimeout(() => {
        setUser({
          username: 'demo_user',
          webhookKey: 'demo_webhook_key_12345',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z'
        });
        setLoading(false);
      }, 1000);
    };

    loadUserData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
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
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          {/* 用户信息卡片 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">用户中心</h2>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 dark:bg-gray-600 dark:hover:bg-gray-700 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all"
              >
                返回首页
              </button>
            </div>
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
                  <span className="font-medium">创建时间:</span> {new Date(user.createdAt).toLocaleString()}
                </p>
              )}
            </div>
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
              />
              <NavigationCard
                href="/user/messages"
                title="我的消息"
                description="查看和管理所有收到的短信消息"
                colorTheme="green"
                randomColor={false}
                className=""
              />
              <NavigationCard
                href="/templates"
                title="应用模版"
                description="查看和管理应用模版"
                colorTheme="purple"
                randomColor={false}
                className=""
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
