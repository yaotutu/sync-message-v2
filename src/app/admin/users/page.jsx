'use client';

import { useState, useEffect, useCallback } from 'react';
import { isAccountActive, formatExpiryDate } from '@/lib/utils/account';
import { useRouter } from 'next/navigation';
import { getStoredAdminPassword } from '@/lib/services/auth';
import { adminApi } from '@/lib/utils/api-client';
import { copyToClipboard } from '@/lib/utils/clipboard';

// Material UI imports
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  CircularProgress,
  Alert,
  IconButton,
  Switch,
  FormControlLabel,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from '@mui/icons-material';

/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} username
 * @property {string} webhookKey
 * @property {string} createdAt
 * @property {boolean} canManageTemplates
 * @property {string|null} expiryDate
 */

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
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
  const deleteUser = async (username) => {
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

  const toggleTemplatePermission = async (username, currentValue) => {
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
    async (username) => {
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
  const copyWebhookKey = async (webhookKey) => {
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1">
            用户管理
          </Typography>
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => router.push('/admin')}
            >
              返回
            </Button>
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={loadUsers}
              disabled={loading}
            >
              刷新
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity={error.includes('复制') ? 'success' : 'error'} sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Paper variant="outlined" sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" component="h2" gutterBottom>
            添加新用户
          </Typography>
          <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: 'repeat(3, 1fr)' }} gap={2}>
            <TextField
              label="用户名"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              disabled={loading}
              fullWidth
            />
            <TextField
              label="密码"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              fullWidth
            />
            <Button
              variant="contained"
              color="success"
              onClick={addUser}
              disabled={loading}
              fullWidth
              sx={{ height: '56px' }}
            >
              {loading ? '添加中...' : '添加用户'}
            </Button>
          </Box>
        </Paper>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : (
          <Box>
            <Typography variant="h6" component="h2" gutterBottom>
              用户列表
            </Typography>
            {users.length === 0 ? (
              <Typography variant="body1" textAlign="center" py={4}>
                暂无用户，请添加用户
              </Typography>
            ) : (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>用户名</TableCell>
                    <TableCell>Webhook密钥</TableCell>
                    <TableCell>模板管理</TableCell>
                    <TableCell>账号状态</TableCell>
                    <TableCell>有效期</TableCell>
                    <TableCell>创建时间</TableCell>
                    <TableCell align="right">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontFamily="monospace">
                            {user.webhookKey}
                          </Typography>
                          <Tooltip title="复制">
                            <IconButton
                              size="small"
                              onClick={() => copyWebhookKey(user.webhookKey)}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {editingTemplate === user.username ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={user.canManageTemplates}
                                  onChange={() =>
                                    toggleTemplatePermission(
                                      user.username,
                                      user.canManageTemplates
                                    )
                                  }
                                />
                              }
                              label={user.canManageTemplates ? '已启用' : '已禁用'}
                            />
                            <IconButton
                              size="small"
                              onClick={() => setEditingTemplate('')}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography>
                              {user.canManageTemplates ? '是' : '否'}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => setEditingTemplate(user.username)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography
                          color={isAccountActive(user.expiryDate) ? 'success.main' : 'error.main'}
                        >
                          {isAccountActive(user.expiryDate) ? '有效' : '无效'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {editingExpiry === user.username ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <TextField
                              size="small"
                              value={expiryInput}
                              onChange={(e) => setExpiryInput(e.target.value)}
                              placeholder="YYYYMMDD"
                              sx={{ width: '120px' }}
                            />
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => saveExpiry(user.username)}
                            >
                              <CheckIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingExpiry('');
                                setExpiryInput('');
                              }}
                            >
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography>{formatExpiryDate(user.expiryDate)}</Typography>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setEditingExpiry(user.username);
                                setExpiryInput(user.expiryDate || '');
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="删除">
                          <IconButton
                            color="error"
                            onClick={() => deleteUser(user.username)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
}