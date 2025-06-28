import { Box, CircularProgress, useMediaQuery, useTheme } from '@mui/material';

/**
 * 加载状态组件
 */
export default function LoadingState({ isMobile }) {
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