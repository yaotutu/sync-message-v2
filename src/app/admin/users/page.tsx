'use client';

import { useState, useEffect, useCallback } from 'react';
import { isAccountActive, formatExpiryDate } from '@/lib/utils/account';
import { useRouter } from 'next/navigation';

type User = {
  id: number;
  username: string;
  webhookKey: string;
  createdAt: string;
  canManageTemplates: boolean;
  expiryDate: string | null;
};
import { getStoredAdminPassword } from '@/lib/services/auth';
import { adminApi } from '@/lib/utils/api-client';
import { copyToClipboard } from '@/lib/utils/clipboard';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingExpiry, setEditingExpiry] = useState('');
  const [expiryInput, setExpiryInput] = useState('');
  const [editingTemplate, setEditingTemplate] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  // 获取管理员密码
  function getAdminPassword() {
    const password = getStoredAdminPassword();
    if (!password) {
      router.push('/admin');
      return null;
    }
    return password;
  }

  // 加载用户列表
  const loadUsers = async () => {
    setLoading(true);
    setError('');

    const password = getAdminPassword();
    if (!password) return;

    try {
      const data = await adminApi.get('/api/admin/users');

      if (data.success) {
        setUsers(data.data || []);
      } else {
        setError(data.message || '加载用户失败');
      }
    } catch (err) {
      console.error('加载用户错误:', err);
      setError('加载用户失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 添加用户
  const addUser = async () => {
    const password = getAdminPassword();
    if (!password) return;

    if (!newUsername.trim() || !newPassword.trim()) {
      setError('用户名和密码不能为空');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await adminApi.post('/api/admin/users', {
        username: newUsername.trim(),
        password: newPassword.trim(),
      });

      if (data.success) {
        setNewUsername('');
        setNewPassword('');
        loadUsers();
      } else {
        setError(data.message || '添加用户失败');
      }
    } catch (err) {
      console.error('添加用户错误:', err);
      setError('添加用户失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  // 删除用户
  const deleteUser = async (username: string) => {
    const password = getAdminPassword();
    if (!password) return;

    if (!confirm(`确定要删除用户 ${username} 吗？`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await adminApi.delete(`/api/admin/users/${username}`);

      if (data.success) {
        loadUsers();
      } else {
        setError(data.message || '删除用户失败');
      }
    } catch (err) {
      console.error('删除用户错误:', err);
      setError('删除用户失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const toggleTemplatePermission = async (username: string, currentValue: boolean) => {
    const password = getAdminPassword();
    if (!password) return;

    setLoading(true);
    setError('');

    try {
      const data = await adminApi.patch(`/api/admin/users/${username}`, {
        canManageTemplates: !currentValue,
      });

      if (data.success) {
        setEditingTemplate('');
        loadUsers();
      } else {
        setError(data.message || '更新模板权限失败');
      }
    } catch (err) {
      console.error('更新模板权限错误:', err);
      setError('更新模板权限失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const saveExpiry = useCallback(
    async (username: string) => {
      if (expiryInput && !/^\d{8}$/.test(expiryInput)) {
        setError('有效期格式应为YYYYMMDD');
        return;
      }

      const password = getAdminPassword();
      if (!password) return;

      setLoading(true);
      setError('');

      try {
        const data = await adminApi.patch(`/api/admin/users/${username}`, {
          expiryDate: expiryInput || null,
        });

        if (data.success) {
          setEditingExpiry('');
          setExpiryInput('');
          loadUsers();
        } else {
          setError(data.message || '更新有效期失败');
        }
      } catch (err) {
        console.error('更新有效期错误:', err);
        setError('更新有效期失败，请检查网络连接');
      } finally {
        setLoading(false);
      }
    },
    [expiryInput],
  );

  // 复制Webhook密钥
  const copyWebhookKey = async (webhookKey: string) => {
    const prevError = error;
    await copyToClipboard(
      webhookKey,
      () => setError('Webhook密钥已复制到剪贴板'),
      () => setError('复制失败，请手动复制'),
    );
    // 2秒后恢复原来的错误信息
    setTimeout(() => {
      setError(prevError);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">用户管理</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                返回
              </button>
              <button
                onClick={loadUsers}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                刷新
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
              {error}
            </div>
          )}

          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">添加新用户</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="用户名"
                  disabled={loading}
                />
              </div>
              <div className="md:col-span-1">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  placeholder="密码"
                  disabled={loading}
                />
              </div>
              <div className="md:col-span-1">
                <button
                  onClick={addUser}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? '添加中...' : '添加用户'}
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 dark:border-gray-600 border-t-blue-600"></div>
              <p className="mt-2 text-gray-600 dark:text-gray-400">加载中...</p>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">用户列表</h2>
              {users.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 dark:text-gray-400">暂无用户，请添加用户</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          用户名
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          Webhook密钥
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          模板管理
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          账号状态
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          有效期
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          创建时间
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                        >
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {user.username}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex flex-wrap items-start gap-2">
                              <span className="font-mono break-all">{user.webhookKey}</span>
                              <button
                                onClick={() => copyWebhookKey(user.webhookKey)}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {editingTemplate === user.username ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    toggleTemplatePermission(user.username, user.canManageTemplates)
                                  }
                                  className={`px-2 py-1 text-xs rounded ${
                                    user.canManageTemplates
                                      ? 'bg-red-600 hover:bg-red-700 text-white'
                                      : 'bg-green-600 hover:bg-green-700 text-white'
                                  }`}
                                >
                                  {user.canManageTemplates ? '禁用' : '启用'}
                                </button>
                                <button
                                  onClick={() => setEditingTemplate('')}
                                  className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                >
                                  取消
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{user.canManageTemplates ? '是' : '否'}</span>
                                <button
                                  onClick={() => setEditingTemplate(user.username)}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
                                >
                                  编辑
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {isAccountActive(user.expiryDate) ? (
                              <span className="text-green-600 dark:text-green-400">有效</span>
                            ) : (
                              <span className="text-red-600 dark:text-red-400">无效</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {editingExpiry === user.username ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={expiryInput}
                                  onChange={(e) => setExpiryInput(e.target.value)}
                                  className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                  placeholder="YYYYMMDD"
                                />
                                <button
                                  onClick={() => saveExpiry(user.username)}
                                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                                >
                                  保存
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingExpiry('');
                                    setExpiryInput('');
                                  }}
                                  className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                                >
                                  取消
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span>{formatExpiryDate(user.expiryDate)}</span>
                                <button
                                  onClick={() => {
                                    setEditingExpiry(user.username);
                                    setExpiryInput(user.expiryDate || '');
                                  }}
                                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
                                >
                                  编辑
                                </button>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(user.createdAt).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                            <button
                              onClick={() => deleteUser(user.username)}
                              className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            >
                              删除
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
