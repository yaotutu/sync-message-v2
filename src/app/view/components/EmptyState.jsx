import { Box, Typography } from '@mui/material';

/**
 * 空状态组件
 */
export default function EmptyState() {
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