import './globals.css';
import FooterController from '@/components/FooterController';

export const metadata = {
  title: '消息同步管理系统',
  description: '管理和同步消息的系统',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className="tongyi-design-pc">
      <body className="h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased overflow-hidden">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh'
        }}>
          <main style={{ flex: 1, overflow: 'auto' }}>
            {children}
          </main>
          <FooterController />
        </div>
      </body>
    </html>
  );
}