import { Card, CardContent, Typography, useMediaQuery, useTheme } from '@mui/material';
import { formatTimestamp, calculateExpiryTime, calculateRemainingDays } from '@/lib/utils/type-conversion.js';

/**
 * 标题卡片组件
 */
export default function HeaderCard({ appName, firstUsedAt, expiryDays, isExpired, rawMessage }) {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    return (
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
                {expiryDays && (
                    <Typography
                        variant="body2"
                        color="info.main"
                        sx={{ mt: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                        有效期：{expiryDays} 天
                        {firstUsedAt && (
                            <>
                                <span style={{ marginLeft: '8px', color: 'text.secondary' }}>
                                    (过期时间：{formatTimestamp(calculateExpiryTime(firstUsedAt, expiryDays))})
                                </span>
                                {!isExpired && (
                                    <span style={{ marginLeft: '8px', color: 'success.main', fontWeight: 'bold' }}>
                                        (剩余 {calculateRemainingDays(firstUsedAt, expiryDays)} 天)
                                    </span>
                                )}
                            </>
                        )}
                    </Typography>
                )}

                {rawMessage && rawMessage.systemReceivedAt && (
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
                        验证码到达时间：{formatTimestamp(rawMessage.systemReceivedAt)}
                    </Typography>
                )}

                {/* 调试信息 - 开发环境显示 */}
                {process.env.NODE_ENV === 'development' && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ mt: 1, display: 'block', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                    >
                        调试信息 - 过期状态: {isExpired ? '已过期' : '未过期'}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
} 