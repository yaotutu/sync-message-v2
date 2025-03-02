'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            消息同步管理系统
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            欢迎使用消息同步管理系统，请选择您要访问的页面
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Link
            href="/admin"
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            管理员后台
          </Link>

          <Link
            href="/user"
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 dark:text-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition-colors"
          >
            用户中心
          </Link>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} 消息同步管理系统. 保留所有权利.
          </p>
        </div>
      </div>
    </div>
  );
}
