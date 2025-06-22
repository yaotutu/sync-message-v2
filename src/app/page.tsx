'use client';

import { useState, useEffect } from 'react';
import { userApi } from '@/lib/utils/api-client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);

  useEffect(() => {
    // 初始显示骨架屏
    setShowSkeleton(true);
    setShowLoginForm(false);

    // 检查是否已登录
    const storedAuth = localStorage.getItem('user_auth');
    if (storedAuth) {
      try {
        const auth = JSON.parse(storedAuth);
        if (auth.username && auth.password) {
          // 直接根据存储的isAdmin状态跳转
          if (auth.isAdmin) {
            router.push('/admin');
          } else {
            router.push('/user');
          }
          return;
        }
      } catch (err) {
        console.error('解析存储的用户信息失败:', err);
        localStorage.removeItem('user_auth');
      }
    }

    // 使用requestAnimationFrame确保骨架屏至少显示一帧
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setShowSkeleton(false);
        setShowLoginForm(true);
      });
    });
  }, []);

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
        const isAdmin = data.data.isAdmin || false;
        // 保存登录信息到本地存储
        localStorage.setItem(
          'user_auth',
          JSON.stringify({
            username,
            password,
            isAdmin,
          }),
        );
        // 根据管理员状态跳转
        if (isAdmin) {
          router.push('/admin');
        } else {
          router.push('/user');
        }
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

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {showSkeleton && (
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
        )}
        {showLoginForm && (
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
        )}
      </div>
    </div>
  );
}
