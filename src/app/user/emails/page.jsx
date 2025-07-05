'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { userApi } from '@/lib/utils/api-client';
import { copyToClipboard } from '@/lib/utils/clipboard';
import {
  Box,
  Button,
  Typography,
  Paper,
  TextField,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  Stack,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';

export default function EmailsPage() {
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ 
    open: false, 
    title: '', 
    message: '', 
    onConfirm: null 
  });

  const router = useRouter();

  // 加载邮箱列表
  const loadEmails = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await userApi.get('/api/user/emails');
      if (response.success) {
        setEmails(response.data.emails);
      } else {
        setError(response.message || '加载邮箱列表失败');
      }
    } catch (err) {
      console.error('加载邮箱列表失败:', err);
      setError('加载邮箱列表失败，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  // 添加邮箱
  const addEmail = async () => {
    if (!newEmail.trim()) {
      setError('请输入邮箱地址');
      return;
    }

    if (!newEmail.includes('@')) {
      setError('请输入有效的邮箱地址');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const response = await userApi.post('/api/user/emails', {
        email: newEmail.trim()
      });
      if (response.success) {
        setNewEmail('');
        setSuccess('邮箱添加成功');
        await loadEmails();
      } else {
        setError(response.message || '添加邮箱失败');
      }
    } catch (err) {
      console.error('添加邮箱失败:', err);
      setError('添加邮箱失败，请检查网络连接');
    } finally {
      setIsLoading(false);
    }
  };

  // 删除邮箱
  const deleteEmail = (emailToDelete) => {
    setConfirmDialog({
      open: true,
      title: '确认删除',
      message: `确定要删除邮箱 ${emailToDelete} 吗？`,
      onConfirm: async () => {
        try {
          setIsLoading(true);
          const response = await userApi.delete('/api/user/emails', {
            email: emailToDelete
          }, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          if (response.success) {
            setSuccess('邮箱删除成功');
            await loadEmails();
          } else {
            setError(response.message || '删除邮箱失败');
          }
        } catch (err) {
          console.error('删除邮箱失败:', err);
          setError('删除邮箱失败，请检查网络连接');
        } finally {
          setIsLoading(false);
        }
      }
    });
  };

  // 复制所有邮箱
  const copyAllEmails = async () => {
    const success = await copyToClipboard(
      emails.join('\n'),
      () => setSuccess('已复制所有邮箱到剪贴板'),
      () => setError('复制失败，请手动复制')
    );
    if (!success) {
      setError('复制失败，请手动复制');
    }
  };

  // 初始化加载
  useEffect(() => {
    loadEmails();
  }, []);

  // 关闭对话框
  const closeConfirmDialog = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  // 关闭成功提示
  const handleSuccessClose = () => {
    setSuccess('');
  };

  // 关闭错误提示
  const handleErrorClose = () => {
    setError('');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          邮箱绑定
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => router.push('/user')}
          sx={{
            backgroundColor: '#6b7280',
            '&:hover': {
              backgroundColor: '#4b5563'
            }
          }}
        >
          返回用户中心
        </Button>
      </Box>

      {/* 添加邮箱表单 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            label="新邮箱地址"
            variant="outlined"
            fullWidth
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            disabled={isLoading}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={addEmail}
            disabled={isLoading || !newEmail.trim()}
          >
            添加
          </Button>
        </Stack>
      </Paper>

      {/* 邮箱列表 */}
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">已绑定邮箱</Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="刷新">
              <IconButton onClick={loadEmails} disabled={isLoading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="复制所有邮箱">
              <IconButton onClick={copyAllEmails} disabled={isLoading || emails.length === 0}>
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {isLoading && emails.length === 0 ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : emails.length === 0 ? (
          <Typography variant="body1" color="text.secondary" textAlign="center" p={3}>
            暂无绑定邮箱，请添加
          </Typography>
        ) : (
          <Stack spacing={1}>
            {emails.map((email) => (
              <Paper key={email} variant="outlined" sx={{ p: 2 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography>{email}</Typography>
                  <IconButton 
                    color="error" 
                    onClick={() => deleteEmail(email)}
                    disabled={isLoading}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      {/* 成功提示 */}
      <Snackbar
        open={!!success}
        autoHideDuration={3000}
        onClose={handleSuccessClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSuccessClose} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>

      {/* 错误提示 */}
      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={handleErrorClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleErrorClose} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* 确认对话框 */}
      <Dialog
        open={confirmDialog.open}
        onClose={closeConfirmDialog}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirmDialog}>取消</Button>
          <Button 
            onClick={() => {
              confirmDialog.onConfirm();
              closeConfirmDialog();
            }}
            color="error"
            autoFocus
          >
            确认
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}