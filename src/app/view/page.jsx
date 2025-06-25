'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Button,
    Paper,
    Container,
    Alert,
    CircularProgress,
    Divider,
    useTheme,
    useMediaQuery
} from '@mui/material';
import { copyToClipboard } from '@/lib/utils/clipboard';
import Footer from '@/components/Footer';

/**
 * 提取短信中的验证码
 * @param {string} content - 短信内容
 * @returns {string|null} 验证码或null
 */
function extractVerificationCode(content) {
    if (!content) return null;

    // 查找"验证码"后面的第一串数字
    const pattern = /验证码[^0-9]*(\d{4,8})/;
    const match = content.match(pattern);

    if (match && match[1]) {
        return match[1];
    }

    return null;
}

function ViewPageContent() {
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState(null);
    const [copyStatus, setCopyStatus] = useState({ phone: '', code: '' });

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        const cardKey = searchParams.get('cardKey');
        const appName = searchParams.get('appName');
        const phone = searchParams.get('phone');

        if (!cardKey || !appName) {
            setError('无效的链接参数');
            setIsLoading(false);
            return;
        }

        const loadData = async () => {
            setIsLoading(true);
            setError('');

            try {
                const params = new URLSearchParams();
                params.append('cardKey', cardKey);
                params.append('appName', encodeURIComponent(appName));
                if (phone) {
                    params.append('phone', phone);
                }

                const response = await fetch(`/api/public/messages?${params.toString()}`);
                const result = await response.json();

                if (result.success) {
                    setData(result);
                } else {
                    setError(result.error || '加载失败');
                }
            } catch (error) {
                setError('加载失败，请检查网络连接');
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [searchParams]);

    const handleCopy = async (text, type) => {
        await copyToClipboard(
            text,
            () => {
                setCopyStatus(prev => ({
                    ...prev,
                    [type]: '复制成功!'
                }));
                setTimeout(() => {
                    setCopyStatus(prev => ({
                        ...prev,
                        [type]: ''
                    }));
                }, 2000);
            },
            () => {
                setCopyStatus(prev => ({
                    ...prev,
                    [type]: '复制失败'
                }));
            }
        );
    };

    if (isLoading) {
        return (
            <Box
                sx={{
                    height: '100%',
                    bgcolor: 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2
                }}
            >
                <CircularProgress size={isMobile ? 40 : 60} />
            </Box>
        );
    }

    if (error) {
        return (
            <Box
                sx={{
                    height: '100%',
                    bgcolor: 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2
                }}
            >
                <Alert severity="error" sx={{ maxWidth: '100%' }}>
                    {error}
                </Alert>
            </Box>
        );
    }

    if (!data) {
        return (
            <Box
                sx={{
                    height: '100%',
                    bgcolor: 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 2
                }}
            >
                <Typography variant="body1" color="text.secondary" align="center">
                    暂无数据
                </Typography>
            </Box>
        );
    }

    const { message, firstUsedAt } = data;
    const appName = searchParams.get('appName');
    const phone = searchParams.get('phone');

    // 提取验证码
    const verificationCode = message ? extractVerificationCode(message) : null;
    const displayContent = verificationCode || message || '未找到验证码';

    // 修复时间戳显示
    const formatFirstUsedTime = (timestamp) => {
        if (!timestamp) return '';
        // 确保时间戳是数字
        const time = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
        return new Date(time).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <Box
            sx={{
                height: '100%',
                bgcolor: 'grey.100',
                py: { xs: 2, sm: 4 },
                px: { xs: 1, sm: 2 }
            }}
        >
            <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2 } }}>
                {/* 标题卡片 */}
                <Card sx={{ mb: { xs: 2, sm: 3 } }}>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Typography
                            variant={isMobile ? "h6" : "h5"}
                            component="h2"
                            gutterBottom
                            sx={{ wordBreak: 'break-word' }}
                        >
                            {appName} - 快速复制
                        </Typography>
                        {firstUsedAt && (
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ mt: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                            >
                                首次使用时间：{formatFirstUsedTime(firstUsedAt)}
                            </Typography>
                        )}
                    </CardContent>
                </Card>

                {/* 主要内容卡片 */}
                <Card>
                    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 3, sm: 4 } }}>
                            {/* 手机号部分 */}
                            <Box>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    justifyContent: 'space-between',
                                    alignItems: { xs: 'stretch', sm: 'center' },
                                    mb: 2,
                                    gap: { xs: 1, sm: 0 }
                                }}>
                                    <Typography
                                        variant={isMobile ? "subtitle1" : "h6"}
                                        component="h3"
                                        sx={{ fontWeight: 'bold' }}
                                    >
                                        手机号
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => phone && handleCopy(phone, 'phone')}
                                        disabled={!phone}
                                        size={isMobile ? "large" : "medium"}
                                        sx={{
                                            minHeight: { xs: 48, sm: 36 },
                                            fontSize: { xs: '0.875rem', sm: '0.875rem' },
                                            px: { xs: 3, sm: 2 }
                                        }}
                                    >
                                        {copyStatus.phone || '复制账号'}
                                    </Button>
                                </Box>
                                <Paper
                                    sx={{
                                        p: { xs: 2, sm: 2 },
                                        bgcolor: 'grey.100',
                                        fontFamily: 'monospace',
                                        fontSize: { xs: '1rem', sm: '1.125rem' },
                                        wordBreak: 'break-all',
                                        minHeight: { xs: 48, sm: 56 }
                                    }}
                                >
                                    {phone || '无手机号'}
                                </Paper>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        mt: 1,
                                        display: 'block',
                                        fontSize: { xs: '0.75rem', sm: '0.75rem' }
                                    }}
                                >
                                    第一步：点击"复制账号"按钮复制手机号
                                </Typography>
                            </Box>

                            <Divider sx={{ my: { xs: 1, sm: 2 } }} />

                            {/* 验证码部分 */}
                            <Box>
                                <Box sx={{
                                    display: 'flex',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    justifyContent: 'space-between',
                                    alignItems: { xs: 'stretch', sm: 'center' },
                                    mb: 2,
                                    gap: { xs: 1, sm: 0 }
                                }}>
                                    <Typography
                                        variant={isMobile ? "subtitle1" : "h6"}
                                        component="h3"
                                        sx={{ fontWeight: 'bold' }}
                                    >
                                        {verificationCode ? '验证码' : '短信内容'}
                                    </Typography>
                                    <Button
                                        variant="contained"
                                        color="success"
                                        onClick={() => displayContent && handleCopy(displayContent, 'code')}
                                        disabled={!displayContent}
                                        size={isMobile ? "large" : "medium"}
                                        sx={{
                                            minHeight: { xs: 48, sm: 36 },
                                            fontSize: { xs: '0.875rem', sm: '0.875rem' },
                                            px: { xs: 3, sm: 2 }
                                        }}
                                    >
                                        {copyStatus.code || (verificationCode ? '复制验证码' : '复制内容')}
                                    </Button>
                                </Box>
                                <Paper
                                    sx={{
                                        p: { xs: 2, sm: 2 },
                                        bgcolor: 'grey.100',
                                        fontFamily: 'monospace',
                                        fontSize: { xs: '1rem', sm: '1.125rem' },
                                        textAlign: verificationCode ? 'center' : 'left',
                                        wordBreak: 'break-all',
                                        minHeight: { xs: 48, sm: 56 },
                                        display: 'flex',
                                        alignItems: verificationCode ? 'center' : 'flex-start',
                                        justifyContent: verificationCode ? 'center' : 'flex-start'
                                    }}
                                >
                                    {displayContent}
                                </Paper>
                                <Typography
                                    variant="caption"
                                    color="text.secondary"
                                    sx={{
                                        mt: 1,
                                        display: 'block',
                                        fontSize: { xs: '0.75rem', sm: '0.75rem' }
                                    }}
                                >
                                    第二步：点击"复制{verificationCode ? '验证码' : '内容'}"按钮复制{verificationCode ? '验证码' : '短信内容'}
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}

export default function ViewPage() {
    return (
        <Box sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'grey.100'
        }}>
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                <Suspense fallback={
                    <Box
                        sx={{
                            height: '100%',
                            bgcolor: 'grey.100',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            p: 2
                        }}
                    >
                        <CircularProgress />
                    </Box>
                }>
                    <ViewPageContent />
                </Suspense>
            </Box>
            <Footer />
        </Box>
    );
} 