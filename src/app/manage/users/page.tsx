'use client';

import { useState, useEffect } from 'react';
import { User } from '@/types/manage';
import Link from 'next/link';
import { AdminLogin } from '../components/AdminAuth';

// 获取管理员密码
function getAdminPassword() {
    try {
        const stored = localStorage.getItem('admin_auth');
        if (!stored) return '';
        const data = JSON.parse(stored);
        return data.password || '';
    } catch (e) {
        return '';
    }
}

export default function UsersPage() {
    const [error, setError] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [newUsername, setNewUsername] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    const loadData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch('/api/manage/users', {
                headers: {
                    'x-admin-password': getAdminPassword(),
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setUsers(data.data || []);
            } else {
                setError(data.message || '加载用户列表失败');
            }
        } catch (error) {
            console.error('Load users error:', error);
            setError('网络错误，请检查网络连接后重试');
        } finally {
            setIsLoading(false);
        }
    };

    // 在组件挂载后加载数据
    useEffect(() => {
        setMounted(true);
        const adminPassword = getAdminPassword();
        if (adminPassword) {
            loadData();
        }
    }, []);

    const addUser = async () => {
        const trimmedUsername = newUsername.trim();
        const trimmedPassword = newUserPassword.trim();

        if (!trimmedUsername || !trimmedPassword) {
            setError('用户名和密码不能为空');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const response = await fetch('/api/manage/users', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-password': getAdminPassword(),
                },
                body: JSON.stringify({
                    username: trimmedUsername,
                    password: trimmedPassword,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                setNewUsername('');
                setNewUserPassword('');
                await loadData();
            } else {
                setError(data.message || '添加用户失败');
            }
        } catch (error) {
            console.error('Add user error:', error);
            setError('网络错误，请检查网络连接后重试');
        } finally {
            setIsLoading(false);
        }
    };

    const deleteUser = async (username: string) => {
        if (!confirm(`确定要删除用户 ${username} 吗？此操作不可恢复。`)) {
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/manage/users?username=${encodeURIComponent(username)}`, {
                method: 'DELETE',
                headers: {
                    'x-admin-password': getAdminPassword(),
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                await loadData();
            } else {
                setError(data.message || '删除用户失败');
            }
        } catch (error) {
            console.error('Delete user error:', error);
            setError('网络错误，请检查网络连接后重试');
        } finally {
            setIsLoading(false);
        }
    };

    const copyWebhookKey = async (webhookKey: string) => {
        try {
            await navigator.clipboard.writeText(webhookKey);
            const prevError = error;
            setError('Webhook Key 已复制到剪贴板');
            setTimeout(() => {
                setError(prevError);
            }, 2000);
        } catch (err) {
            console.error('Copy failed:', err);
            setError('复制失败，请手动复制');
        }
    };

    // 在组件挂载前不渲染用户列表
    if (!mounted) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
                <div className="max-w-4xl mx-auto">
                    <AdminLogin showLogout={false} />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <AdminLogin showLogout={false}>
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">用户管理</h2>
                                <Link
                                    href="/manage"
                                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                >
                                    返回管理后台
                                </Link>
                            </div>
                            <div className="space-y-4">
                                <div className="flex gap-4">
                                    <input
                                        type="text"
                                        value={newUsername}
                                        onChange={(e) => setNewUsername(e.target.value)}
                                        placeholder="用户名"
                                        className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-600"
                                        disabled={isLoading}
                                    />
                                    <input
                                        type="password"
                                        value={newUserPassword}
                                        onChange={(e) => setNewUserPassword(e.target.value)}
                                        placeholder="密码"
                                        className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-600"
                                        disabled={isLoading}
                                    />
                                    <button
                                        onClick={addUser}
                                        disabled={isLoading}
                                        className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:bg-green-300 dark:disabled:bg-green-400 transition-all whitespace-nowrap"
                                    >
                                        {isLoading ? '添加中...' : '添加用户'}
                                    </button>
                                </div>
                                {error && (
                                    <div className="text-red-500 dark:text-red-400 text-sm">{error}</div>
                                )}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                            <div className="p-6 pb-4 flex justify-between items-center border-b dark:border-gray-700">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">用户列表</h3>
                                <button
                                    onClick={loadData}
                                    disabled={isLoading}
                                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:bg-blue-300 dark:disabled:bg-blue-400 transition-all"
                                >
                                    {isLoading ? '刷新中...' : '刷新'}
                                </button>
                            </div>
                            <div className="divide-y dark:divide-gray-700">
                                {users.map((user) => (
                                    <div key={user.username} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <div className="space-y-1">
                                            <div className="font-medium text-gray-900 dark:text-white">{user.username}</div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                                                Webhook Key: {user.webhookKey || '未设置'}
                                                {user.webhookKey && (
                                                    <button
                                                        onClick={() => copyWebhookKey(user.webhookKey!)}
                                                        className="ml-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        复制
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => deleteUser(user.username)}
                                            disabled={isLoading}
                                            className="px-3 py-1 text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                        >
                                            删除
                                        </button>
                                    </div>
                                ))}
                                {users.length === 0 && (
                                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                        暂无用户
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </AdminLogin>
            </div>
        </div>
    );
} 