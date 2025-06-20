'use client';

import { useState, useEffect } from 'react';
import { userApi } from '@/lib/utils/api-client';
import Link from 'next/link';

interface User {
  username: string;
  webhookKey?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function UserPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [showSkeleton, setShowSkeleton] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    // 检查是否已登录
    const storedAuth = localStorage.getItem('user_auth');
    if (storedAuth) {
      try {
        const auth = JSON.parse(storedAuth);
        if (auth.username && auth.password) {
          setUsername(auth.username);
          setPassword(auth.password);
          setIsLoggedIn(true);
          loadUserData(auth.username, auth.password)
            .finally(() => {
              setAuthChecked(true);
              setShowSkeleton(false);
            });
          return;
        }
      } catch (err) {
        console.error('解析存储的用户信息失败:', err);
        localStorage.removeItem('user_auth');
      }
    }

    // 无认证信息或认证失败时
    setAuthChecked(true);
    setShowSkeleton(false);
  }, []);

  // 加载用户数据
  const loadUserData = async (username: string, password: string) => {
    setLoading(true);
    setError('');

    try {
      // 获取用户信息
      const userData = await userApi.post('/api/user/login', { username, password });

      if (!userData.success) {
        setError(userData.message || '登录失败');
        setIsLoggedIn(false);
        localStorage.removeItem('user_auth');
        setLoading(false);
        return;
      }

      setUser(userData.data);
    } catch (err) {
      console.error('加载用户数据错误:', err);
      setError('加载用户数据失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 用户登录
  const handleLogin = async () => {
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await userApi.post('/api/user/login', { username, password });

      if (data.success) {
        setIsLoggedIn(true);
        setUser(data.data);

        // 保存登录信息到本地存储
        localStorage.setItem(
          'user_auth',
          JSON.stringify({
            username,
            password,
          }),
        );
      } else {
        setError(data.message || '登录失败');
      }
    } catch (err) {
      console.error('登录错误:', err);
      setError('登录失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 用户注销
  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
    setUsername('');
    setPassword('');
    localStorage.removeItem('user_auth');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {showSkeleton ? (
          // 初始加载骨架屏
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
        ) : !isLoggedIn ? (
          // 登录表单
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">用户登录</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  用户名
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="请输入用户名"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  密码
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="请输入密码"
                  disabled={loading}
                />
              </div>
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:bg-blue-300 dark:disabled:bg-blue-400 transition-all"
              >
                {loading ? '登录中...' : '登录'}
              </button>
              {error && <div className="text-red-500 dark:text-red-400 text-sm">{error}</div>}
            </div>
          </div>
        ) : (
          // 用户信息和功能区
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">用户中心</h2>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all"
                >
                  退出登录
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
              </div>
            </div>

            {/* 功能导航卡片 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">功能导航</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/user/cardlinks"
                  className="block p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all"
                >
                  <h4 className="text-lg font-medium text-blue-700 dark:text-blue-300 mb-2">
                    卡密链接管理
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    创建和管理带有链接的卡密，用于短信验证码过滤
                  </p>
                </Link>
                <Link
                  href="/user/messages"
                  className="block p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-all"
                >
                  <h4 className="text-lg font-medium text-green-700 dark:text-green-300 mb-2">
                    我的消息
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    查看和管理所有收到的短信消息
                  </p>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
