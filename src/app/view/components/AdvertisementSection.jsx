import { Box, Card, CardContent, Typography, useTheme, useMediaQuery } from '@mui/material';
import { useState, useEffect } from 'react';

/**
 * 广告组件
 * @param {Object} props
 * @param {string} props.cardKey - 卡密链接key（必填）
 */
export default function AdvertisementSection({ cardKey }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [showAds, setShowAds] = useState(true);
    const [loading, setLoading] = useState(true);

    // 验证必填参数
    if (!cardKey) {
        console.error('AdvertisementSection: cardKey 参数是必填的');
        return null;
    }

    // 从环境变量读取广告信息
    const adContent = process.env.NEXT_PUBLIC_AD_CONTENT || '《顽童科技》👉资深专业团队、方案咨询DIY定制、小程序/编程/脚本开发、快速交付！';
    const adUrl = process.env.NEXT_PUBLIC_AD_URL || 'https://example.com';

    // 查询用户showAds设置
    useEffect(() => {
        const checkUserAdsSetting = async () => {
            try {
                const response = await fetch(`/api/public/user-ads-setting?cardKey=${encodeURIComponent(cardKey)}`);
                const result = await response.json();

                if (result.success) {
                    setShowAds(result.data.showAds);
                } else {
                    console.error('获取用户广告设置失败:', result.error);
                    setShowAds(true); // 默认显示广告
                }
            } catch (error) {
                console.error('查询用户广告设置出错:', error);
                setShowAds(true); // 默认显示广告
            } finally {
                setLoading(false);
            }
        };

        checkUserAdsSetting();
    }, [cardKey]);

    // 如果正在加载或用户设置不显示广告，返回null
    if (loading || !showAds) {
        return null;
    }

    const handleAdClick = () => {
        window.open(adUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <Box sx={{ mt: { xs: 2, sm: 3 } }}>
            <Card
                sx={{
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: theme.shadows[8],
                        bgcolor: 'primary.light',
                        '& .MuiTypography-root': {
                            color: 'white'
                        }
                    }
                }}
                onClick={handleAdClick}
            >
                <CardContent sx={{
                    p: { xs: 2, sm: 3 },
                    textAlign: 'center'
                }}>
                    <Typography
                        variant={isMobile ? "body1" : "h6"}
                        sx={{
                            fontWeight: 'bold',
                            color: 'primary.main',
                            transition: 'color 0.3s ease',
                            wordBreak: 'break-word',
                            lineHeight: 1.4
                        }}
                    >
                        {adContent}
                    </Typography>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            mt: 1,
                            display: 'block',
                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                        }}
                    >
                        点击了解更多 →
                    </Typography>
                </CardContent>
            </Card>
        </Box>
    );
} 