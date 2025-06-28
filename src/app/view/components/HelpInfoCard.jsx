import { Card, CardContent, Typography, Box, useMediaQuery, useTheme } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';

/**
 * 帮助信息卡片组件
 */
export default function HelpInfoCard() {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Card
            sx={{
                mb: { xs: 2, sm: 3 },
                border: `2px solid ${theme.palette.info.main}`,
                bgcolor: 'info.50',
                '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-2px)',
                    transition: 'all 0.3s ease-in-out'
                }
            }}
        >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <InfoIcon
                        sx={{
                            color: 'info.main',
                            fontSize: { xs: '1.5rem', sm: '2rem' },
                            mr: 1
                        }}
                    />
                    <Typography
                        variant={isMobile ? "h6" : "h5"}
                        component="h3"
                        color="info.main"
                        sx={{ fontWeight: 'bold' }}
                    >
                        使用帮助
                    </Typography>
                </Box>

                <Box sx={{ pl: { xs: 1, sm: 2 } }}>
                    <Typography
                        variant="body1"
                        sx={{
                            mb: 1.5,
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            fontWeight: 'medium',
                            color: 'text.primary'
                        }}
                    >
                        <Box component="span" sx={{
                            display: 'inline-block',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            bgcolor: 'info.main',
                            color: 'white',
                            textAlign: 'center',
                            lineHeight: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            mr: 1
                        }}>
                            1
                        </Box>
                        点右侧"复制账号"进入APP切换手机验证码登录粘贴上去～
                    </Typography>

                    <Typography
                        variant="body1"
                        sx={{
                            fontSize: { xs: '0.9rem', sm: '1rem' },
                            fontWeight: 'medium',
                            color: 'text.primary'
                        }}
                    >
                        <Box component="span" sx={{
                            display: 'inline-block',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            bgcolor: 'info.main',
                            color: 'white',
                            textAlign: 'center',
                            lineHeight: '20px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            mr: 1
                        }}>
                            2
                        </Box>
                        返回本网页等待30秒内获取验证码登录即可～
                    </Typography>
                </Box>

                <Typography
                    variant="caption"
                    color="info.main"
                    sx={{
                        mt: 2,
                        display: 'block',
                        fontStyle: 'italic',
                        fontSize: { xs: '0.75rem', sm: '0.8rem' }
                    }}
                >
                    💡 提示：请确保网络连接正常，验证码会在30秒内自动获取并显示
                </Typography>
            </CardContent>
        </Card>
    );
} 