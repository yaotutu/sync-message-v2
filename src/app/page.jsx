'use client';

import { useState, useEffect } from 'react';
import { userApi } from '@/lib/utils/api-client';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Skeleton,
  Alert,
  Container,
  Paper,
  Divider,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Person,
  Lock,
  Warning,
  Error
} from '@mui/icons-material';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
        const canManageTemplates = data.data.canManageTemplates || false;
        const cardLinkTags = data.data.cardLinkTags || [];
        const showFooter = data.data.showFooter !== undefined ? data.data.showFooter : true;
        const showAds = data.data.showAds !== undefined ? data.data.showAds : true;

        localStorage.setItem(
          'user_auth',
          JSON.stringify({
            username,
            password,
            isAdmin,
            canManageTemplates,
            cardLinkTags,
            showFooter,
            showAds,
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  return (
    <Box
      sx={{
        height: '100%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
          px: 2
        }}
      >
        <Container maxWidth="sm">
          {showSkeleton && (
            <Card sx={{
              maxWidth: 480,
              mx: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              borderRadius: 3
            }}>
              <CardContent sx={{ p: 4 }}>
                <Skeleton variant="text" width="60%" height={40} sx={{ mb: 4 }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <Skeleton variant="rectangular" height={56} />
                  <Skeleton variant="rectangular" height={56} />
                  <Skeleton variant="rectangular" height={48} />
                </Box>
              </CardContent>
            </Card>
          )}

          {showLoginForm && (
            <Card sx={{
              maxWidth: 480,
              mx: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              {/* 页面头部 */}
              <Box sx={{
                bgcolor: 'primary.main',
                color: 'white',
                p: 3,
                textAlign: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
                  消息同步管理系统
                </Typography>
                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  请登录您的账户
                </Typography>
              </Box>

              <CardContent sx={{ p: 4 }}>
                {/* 错误提示 - 更加明显的样式 */}
                {error && (
                  <Alert
                    severity="error"
                    sx={{
                      mb: 3,
                      borderRadius: 2,
                      '& .MuiAlert-icon': {
                        fontSize: '1.5rem'
                      },
                      '& .MuiAlert-message': {
                        fontSize: '1rem',
                        fontWeight: 500
                      }
                    }}
                    icon={<Error sx={{ fontSize: '1.5rem' }} />}
                  >
                    {error}
                  </Alert>
                )}

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {/* 用户名输入框 */}
                  <TextField
                    fullWidth
                    label="用户名"
                    variant="outlined"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="请输入您的用户名"
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />

                  {/* 密码输入框 */}
                  <TextField
                    fullWidth
                    label="密码"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="请输入您的密码"
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                            edge="end"
                            disabled={loading}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2,
                        '&:hover fieldset': {
                          borderColor: 'primary.main',
                        },
                      },
                    }}
                  />

                  {/* 登录按钮 */}
                  <Button
                    variant="contained"
                    onClick={handleLogin}
                    disabled={loading}
                    fullWidth
                    size="large"
                    sx={{
                      mt: 2,
                      py: 1.5,
                      borderRadius: 2,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                      },
                      '&:disabled': {
                        background: 'rgba(0,0,0,0.12)',
                      }
                    }}
                  >
                    {loading ? '登录中...' : '登录'}
                  </Button>

                  {/* 系统信息 */}
                  <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary" align="center">
                      【 v5.85最新版（终极补丁加强）】
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Container>
      </Box>
    </Box>
  );
}