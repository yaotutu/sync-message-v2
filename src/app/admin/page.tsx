'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredAdminPassword, setStoredAdminPassword, clearStoredAdminPassword } from '@/lib/services/auth';
import { adminApi } from '@/lib/api-client';

export default function AdminPage() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const storedPassword = getStoredAdminPassword();
        if (storedPassword) {
            setIsLoggedIn(true);
        }
    }, []);

    const handleLogin = async () => {
        if (!password.trim()) {
            setError('请输入管理员密码');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = await adminApi.post('/api/admin/login', { password });

            if (data.success) {
                setStoredAdminPassword(password);
                setIsLoggedIn(true);
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

    const handleLogout = () => {
        clearStoredAdminPassword();
        setIsLoggedIn(false);
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {isLoggedIn ? (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">管理后台</h2>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                >
                                    退出登录
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Link
                                    href="/admin/users"
                                    className="block p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                    <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-400 mb-2">用户管理</h3>
                                    <p className="text-blue-600 dark:text-blue-300 text-sm">管理系统用户，包括添加、删除用户等操作</p>
                                </Link>
                                <Link
                                    href="/admin/templates"
                                    className="block p-6 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                >
                                    <h3 className="text-xl font-semibold text-green-700 dark:text-green-400 mb-2">模板管理</h3>
                                    <p className="text-green-600 dark:text-green-300 text-sm">管理消息模板，自定义消息格式和样式</p>
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">管理员登录</h2>

                        {error && (
                            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    管理员密码
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                    placeholder="输入管理员密码"
                                />
                            </div>
                            <div>
                                <button
                                    onClick={handleLogin}
                                    disabled={loading}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? '登录中...' : '登录'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 