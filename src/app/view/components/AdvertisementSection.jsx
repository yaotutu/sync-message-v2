import { Box, Card, CardContent, Typography, useTheme, useMediaQuery } from '@mui/material';

/**
 * 广告组件
 */
export default function AdvertisementSection() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // 从环境变量读取广告信息
    const adContent = process.env.NEXT_PUBLIC_AD_CONTENT || '《顽童科技》👉资深专业团队、方案咨询DIY定制、小程序/编程/脚本开发、快速交付！';
    const adUrl = process.env.NEXT_PUBLIC_AD_URL || 'https://example.com';

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