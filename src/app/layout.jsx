import './globals.css';

export const metadata = {
  title: '消息同步管理系统',
  description: '管理和同步消息的系统',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN" className="tongyi-design-pc">
      <body className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 antialiased">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh'
        }}>
          <main style={{ flex: 1 }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}