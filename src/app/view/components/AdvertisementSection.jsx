import { Box, Paper, useMediaQuery, useTheme } from '@mui/material';

/**
 * 右下角浮动广告图片组件（电脑端更大，点击跳转链接）
 */
export default function AdvertisementSection() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const width = isMobile ? 220 : 420;
    const adUrl = 'https://pqy513oupi3.feishu.cn/docx/A9jpdvi1oo6Ws5xpn5ncniWFnDb';

    const handleClick = () => {
        window.open(adUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <Box
            sx={{
                position: 'fixed',
                zIndex: 1300,
                bottom: 70,
                right: 0,
                pointerEvents: 'none',
                width,
                height: 'auto',
                display: 'flex',
                alignItems: 'flex-end',
            }}
        >
            <Paper
                elevation={8}
                sx={{
                    pointerEvents: 'auto',
                    borderRadius: 3,
                    bgcolor: 'rgba(33, 33, 33, 0.45)',
                    boxShadow: 8,
                    width: '100%',
                    height: 'auto',
                    overflow: 'hidden',
                    p: 0,
                    display: 'flex',
                }}
            >
                <img
                    src="/ad.png"
                    alt="广告"
                    onClick={handleClick}
                    style={{
                        width: '100%',
                        height: 'auto',
                        objectFit: 'contain',
                        borderRadius: 0,
                        display: 'block',
                        margin: 0,
                        boxShadow: 'none',
                        cursor: 'pointer',
                        background: 'transparent',
                    }}
                />
            </Paper>
        </Box>
    );
} 