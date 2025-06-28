import { Box, Alert, Typography } from '@mui/material';

/**
 * 错误状态组件
 */
export default function ErrorState({ error, isExpired, expiryDays, firstUsedAt }) {
    // 检查卡密是否过期
    if (isExpired) {
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
                    {expiryDays && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            有效期：{expiryDays} 天
                        </Typography>
                    )}
                </Alert>
            </Box>
        );
    }

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