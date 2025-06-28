'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Box, Container, useTheme, useMediaQuery } from '@mui/material';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { extractVerificationCode, fetchMessageData } from './utils/messageUtils';
import {
    AdvertisementSection,
    HeaderCard,
    MessageContent,
    CodeDialog,
    LoadingState,
    ErrorState,
    EmptyState
} from './components';
import Footer from '@/components/Footer';

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
    }, [data, lastCode]);

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

    // 渲染不同状态
    if (isLoading) {
        return <LoadingState isMobile={isMobile} />;
    }

    if (error || (data && data.isExpired)) {
        return (
            <ErrorState
                error={error}
                isExpired={data?.isExpired}
                expiryDays={data?.expiryDays}
                firstUsedAt={data?.firstUsedAt}
            />
        );
    }

    if (!data) {
        return <EmptyState />;
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
                <HeaderCard
                    appName={appName}
                    firstUsedAt={firstUsedAt}
                    expiryDays={data.expiryDays}
                    isExpired={data.isExpired}
                    rawMessage={data.rawMessage}
                />

                {/* 主要内容卡片 */}
                <MessageContent
                    phone={phone}
                    displayContent={displayContent}
                    verificationCode={verificationCode}
                    copyStatus={copyStatus}
                    onCopy={handleCopy}
                    codeLoading={codeLoading}
                    isMobile={isMobile}
                />

                {/* 广告信息 */}
                <AdvertisementSection />
            </Container>

            {/* 验证码弹窗 */}
            <CodeDialog
                open={codeDialogOpen}
                onClose={() => setCodeDialogOpen(false)}
                code={lastCode}
            />
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
                <Suspense fallback={<LoadingState isMobile={false} />}>
                    <ViewPageContent />
                </Suspense>
            </Box>
            <Footer />
        </Box>
    );
} 