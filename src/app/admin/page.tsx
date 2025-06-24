'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@mui/material';
import { logout } from '@/lib/utils/auth';
import NavigationCard from '@/components/NavigationCard';

export default function AdminPage() {
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">管理后台</h2>
              <Button variant="contained" color="error" onClick={handleLogout}>
                退出登录
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NavigationCard
                href="/admin/users"
                title="用户管理"
                description="管理系统用户，包括添加、删除用户等操作"
                colorTheme="blue"
                randomColor={false}
                className=""
              />
              <NavigationCard
                href="/templates"
                title="模板管理"
                description="管理消息模板，自定义消息格式和样式"
                colorTheme="green"
                randomColor={false}
                className=""
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
