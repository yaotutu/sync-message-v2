'use client';

import { useState, useEffect } from 'react';
import { userApi } from '@/lib/utils/api-client';
import { useRouter } from 'next/navigation';
import { 
  Box,
  Button,
  Card,
  CardContent,
  Input,
  Typography,
  Skeleton
} from '@mui/material';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);

  useEffect(() => {
    setShowSkeleton(true);
    setShowLoginForm(false);

    const storedAuth = localStorage.getItem('user_auth');
    if (storedAuth) {
      try {
        const auth = JSON.parse(storedAuth);
        if (auth.username && auth.password) {
          if (auth.isAdmin) {
            router.push('/admin');
          } else {
            router.push('/user');
          }
          return;
        }
      } catch (err) {
        console.error('解析存储的用户信息失败:', err);
        localStorage.removeItem('user_auth');
      }
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setShowSkeleton(false);
        setShowLoginForm(true);
      });
    });
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await userApi.post('/api/user/login', { username, password });

      if (data.success) {
        const isAdmin = data.data.isAdmin || false;
        localStorage.setItem(
          'user_auth',
          JSON.stringify({
            username,
            password,
            isAdmin,
          }),
        );
        if (isAdmin) {
          router.push('/admin');
        } else {
          router.push('/user');
        }
      } else {
        setError(data.message || '登录失败');
      }
    } catch (err) {
      console.error('登录错误:', err);
      setError('登录失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100', py: 8, px: 4 }}>
      <Box sx={{ maxWidth: '4xl', mx: 'auto' }}>
        {showSkeleton && (
          <Card>
            <CardContent>
              <Skeleton variant="text" width="33%" height={32} sx={{ mb: 3 }} />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Skeleton variant="text" width="100%" height={16} />
                <Skeleton variant="text" width="83%" height={16} />
                <Skeleton variant="rectangular" height={40} />
                <Skeleton variant="text" width="75%" height={16} />
              </Box>
            </CardContent>
          </Card>
        )}
        {showLoginForm && (
          <Card>
            <CardContent>
              <Typography variant="h5" component="h2" gutterBottom>
                用户登录
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box>
                  <Typography variant="body2" component="label" gutterBottom>
                    用户名
                  </Typography>
                  <Input
                    fullWidth
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入用户名"
                    disabled={loading}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" component="label" gutterBottom>
                    密码
                  </Typography>
                  <Input
                    fullWidth
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    disabled={loading}
                  />
                </Box>
                <Button
                  variant="contained"
                  onClick={handleLogin}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? '登录中...' : '登录'}
                </Button>
                {error && (
                  <Typography color="error" variant="body2">
                    {error}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}