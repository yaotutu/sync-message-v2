import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '消息同步管理系统',
  description: '管理和同步消息的系统',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className="tongyi-design-pc">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased">
        {children}
      </body>
    </html>
  );
}
