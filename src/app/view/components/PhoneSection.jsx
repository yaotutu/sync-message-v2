import { Box, Typography, Button, Paper, useMediaQuery, useTheme } from '@mui/material';

/**
 * 手机号部分组件
 */
export default function PhoneSection({ phone, copyStatus, onCopy, isMobile }) {
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          mb: 1.5,
          gap: { xs: 1, sm: 0 },
        }}
      >
        <Typography
          variant={isMobile ? 'subtitle1' : 'h6'}
          component="h3"
          sx={{ fontWeight: 'bold' }}
        >
          手机号/电子邮箱
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => phone && onCopy(phone, 'phone')}
          disabled={!phone}
          size={isMobile ? 'large' : 'medium'}
          sx={{
            minHeight: { xs: 40, sm: 32 },
            fontSize: { xs: '0.875rem', sm: '0.875rem' },
            px: { xs: 2.5, sm: 2 },
          }}
        >
          {copyStatus.phone || '复制账号'}
        </Button>
      </Box>
      <Paper
        sx={{
          p: { xs: 1.5, sm: 1.5 },
          bgcolor: 'grey.100',
          fontFamily: 'monospace',
          fontSize: { xs: '1rem', sm: '1.125rem' },
          wordBreak: 'break-all',
          minHeight: { xs: 40, sm: 48 },
        }}
      >
        {phone || '无手机号'}
      </Paper>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          mt: 0.5,
          display: 'block',
          fontSize: { xs: '0.75rem', sm: '0.75rem' },
        }}
      >
        {/* 第一步：点击"复制账号"按钮复制手机号 */}
      </Typography>
    </Box>
  );
}
