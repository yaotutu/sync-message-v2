'use client';

import { Box, Typography, useTheme } from '@mui/material';

export default function Footer() {
    const theme = useTheme();

    return (
        <Box
            component="footer"
            sx={{
                height: '70px',
                backgroundColor: theme.palette.mode === 'dark'
                    ? theme.palette.grey[900]
                    : theme.palette.grey[100],
                borderTop: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                px: 2,
                py: 1
            }}
        >
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                    textAlign: 'center',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    lineHeight: 1.5
                }}
            >
                联系我们：support@example.com | 微信：sync-message | QQ：123456789
            </Typography>
        </Box>
    );
} 