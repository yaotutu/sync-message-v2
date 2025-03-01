'use client';

import Link from 'next/link';
import { AdminLogin } from './components/AdminAuth';

export default function ManagePage() {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <AdminLogin>
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">管理后台</h2>
                                <button
                                    onClick={() => {
                                        localStorage.removeItem('admin_auth');
                                        window.location.reload();
                                    }}
                                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                >
                                    退出登录
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Link
                                    href="/manage/users"
                                    className="block p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                >
                                    <h3 className="text-xl font-semibold text-blue-700 dark:text-blue-400 mb-2">用户管理</h3>
                                    <p className="text-blue-600 dark:text-blue-300 text-sm">管理系统用户，包括添加、删除用户等操作</p>
                                </Link>
                                <Link
                                    href="/manage/templates"
                                    className="block p-6 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
                                >
                                    <h3 className="text-xl font-semibold text-green-700 dark:text-green-400 mb-2">模板管理</h3>
                                    <p className="text-green-600 dark:text-green-300 text-sm">管理消息模板，自定义消息格式和样式</p>
                                </Link>
                            </div>
                        </div>
                    </div>
                </AdminLogin>
            </div>
        </div>
    );
} 