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
    useMediaQuery,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { copyToClipboard } from '@/lib/utils/clipboard';
import {
    calculateExpiryTime,
    calculateRemainingDays,
    formatTimestamp
} from '@/lib/utils/type-conversion.js';
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

/**
 * 获取验证码数据的工具函数
 * @param {Object} param0
 * @param {string} param0.cardKey
 * @param {string} param0.appName
 * @param {string} [param0.phone]
 * @returns {Promise<Object>} 接口返回数据
 */
async function fetchMessageData({ cardKey, appName, phone }) {
    const params = new URLSearchParams();
    params.append('cardKey', cardKey);
    params.append('appName', encodeURIComponent(appName));
    if (phone) {
        params.append('phone', phone);
    }
    const response = await fetch(`/api/public/messages?${params.toString()}`);
    return await response.json();
}

function ViewPageContent() {
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [data, setData] = useState(null);
    const [copyStatus, setCopyStatus] = useState({ phone: '', code: '' });
    const [codeDialogOpen, setCodeDialogOpen] = useState(false);
    const [lastCode, setLastCode] = useState(null);
    const [codeLoading, setCodeLoading] = useState(false);

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
        setIsLoading(true);
        setError('');
        fetchMessageData({ cardKey, appName, phone })
            .then(result => {
                if (result.success) setData(result);
                else setError(result.error || '加载失败');
            })
            .catch(() => setError('加载失败，请检查网络连接'))
            .finally(() => setIsLoading(false));
    }, [searchParams]);

    // 轮询获取验证码逻辑
    useEffect(() => {
        let intervalId;
        if (data && !data.message) {
            setCodeLoading(true);
            const cardKey = searchParams.get('cardKey');
            const appName = searchParams.get('appName');
            const phone = searchParams.get('phone');
            intervalId = setInterval(async () => {
                try {
                    const result = await fetchMessageData({ cardKey, appName, phone });
                    if (result.success) setData(result);
                } catch { }
            }, 5000);
        } else {
            setCodeLoading(false);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [data, searchParams]);

    // 检测验证码获取到后弹窗
    useEffect(() => {
        if (data && data.message) {
            const code = extractVerificationCode(data.message) || data.message;
            if (code && code !== lastCode) {
                setLastCode(code);
                setCodeDialogOpen(true);
            }
        }
    }, [data]);

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

    // 检查卡密是否过期
    if (data.isExpired) {
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
                <Alert severity="warning" sx={{ maxWidth: '100%' }}>
                    <Typography variant="h6" component="div" gutterBottom>
                        卡密已过期
                    </Typography>
                    <Typography variant="body2">
                        此卡密链接已超过有效期，无法继续使用。
                    </Typography>
                    {data.expiryDays && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            有效期：{data.expiryDays} 天
                        </Typography>
                    )}
                </Alert>
            </Box>
        );
    }

    const { message, firstUsedAt } = data;
    const appName = searchParams.get('appName');
    const phone = searchParams.get('phone');

    // 提取验证码
    const verificationCode = message ? extractVerificationCode(message) : null;
    const displayContent = verificationCode || message || '未找到验证码';

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
                                首次使用时间：{formatTimestamp(firstUsedAt)}
                            </Typography>
                        )}
                        {/* 显示有效期信息 */}
                        {data.expiryDays && (
                            <Typography
                                variant="body2"
                                color="info.main"
                                sx={{ mt: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                            >
                                有效期：{data.expiryDays} 天
                                {firstUsedAt && (
                                    <>
                                        <span style={{ marginLeft: '8px', color: 'text.secondary' }}>
                                            (过期时间：{formatTimestamp(calculateExpiryTime(firstUsedAt, data.expiryDays))})
                                        </span>
                                        {!data.isExpired && (
                                            <span style={{ marginLeft: '8px', color: 'success.main', fontWeight: 'bold' }}>
                                                (剩余 {calculateRemainingDays(firstUsedAt, data.expiryDays)} 天)
                                            </span>
                                        )}
                                    </>
                                )}
                            </Typography>
                        )}
                        {data && data.rawMessage && data.rawMessage.systemReceivedAt && (
                            <Typography
                                variant="body1"
                                color="primary"
                                sx={{
                                    mt: 1,
                                    fontWeight: 'bold',
                                    fontSize: { xs: '1rem', sm: '1.1rem' },
                                    letterSpacing: 1,
                                }}
                            >
                                验证码到达时间：{formatTimestamp(data.rawMessage.systemReceivedAt)}
                            </Typography>
                        )}
                        {/* 调试信息 - 开发环境显示 */}
                        {process.env.NODE_ENV === 'development' && (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ mt: 1, display: 'block', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            >
                                调试信息 - 过期状态: {data.isExpired ? '已过期' : '未过期'}
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
                                        disabled={!displayContent || codeLoading}
                                        size={isMobile ? "large" : "medium"}
                                        sx={{
                                            minHeight: { xs: 48, sm: 36 },
                                            fontSize: { xs: '0.875rem', sm: '0.875rem' },
                                            px: { xs: 3, sm: 2 }
                                        }}
                                    >
                                        {codeLoading ? '正在获取...' : (copyStatus.code || (verificationCode ? '复制验证码' : '复制内容'))}
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
                                    {codeLoading ? <CircularProgress size={24} /> : displayContent}
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
                                    {codeLoading ? '正在获取验证码，请稍候...' : `第二步：点击"复制${verificationCode ? '验证码' : '内容'}"按钮复制${verificationCode ? '验证码' : '短信内容'}`}
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            </Container>
            {/* 验证码弹窗 */}
            <Dialog open={codeDialogOpen} onClose={() => setCodeDialogOpen(false)}>
                <DialogTitle>验证码已获取</DialogTitle>
                <DialogContent>
                    <Typography variant="h5" align="center" sx={{ fontWeight: 'bold', letterSpacing: 2 }}>
                        {lastCode}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCodeDialogOpen(false)} color="primary" variant="contained">知道了</Button>
                </DialogActions>
            </Dialog>
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