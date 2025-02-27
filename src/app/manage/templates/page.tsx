'use client';

import Link from 'next/link';
import { AdminLogin } from '../components/AdminAuth';

export default function TemplatesPage() {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <AdminLogin showLogout={false}>
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">模板管理</h2>
                                <Link
                                    href="/manage"
                                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                >
                                    返回管理后台
                                </Link>
                            </div>
                            <div className="text-center py-12">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/20 mb-4">
                                    <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">功能开发中</h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    模板管理功能正在开发中，敬请期待...
                                </p>
                            </div>
                        </div>
                    </div>
                </AdminLogin>
            </div>
        </div>
    );
} 