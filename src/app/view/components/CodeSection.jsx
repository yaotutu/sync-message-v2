import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  useMediaQuery,
  useTheme,
} from '@mui/material';

/**
 * 验证码部分组件
 */
export default function CodeSection({
  displayContent,
  verificationCode,
  copyStatus,
  onCopy,
  codeLoading,
  isMobile,
}) {
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
          {verificationCode ? '验证码' : '信息内容'}
        </Typography>
        <Button
          variant="contained"
          color="success"
          onClick={() => displayContent && onCopy(displayContent, 'code')}
          disabled={!displayContent || codeLoading}
          size={isMobile ? 'large' : 'medium'}
          sx={{
            minHeight: { xs: 40, sm: 32 },
            fontSize: { xs: '0.875rem', sm: '0.875rem' },
            px: { xs: 2.5, sm: 2 },
          }}
        >
          {codeLoading
            ? '正在获取...'
            : copyStatus.code || (verificationCode ? '复制验证码' : '复制内容')}
        </Button>
      </Box>
      <Paper
        sx={{
          p: { xs: 1.5, sm: 1.5 },
          bgcolor: 'grey.100',
          fontFamily: 'monospace',
          fontSize: { xs: '1rem', sm: '1.125rem' },
          textAlign: verificationCode ? 'center' : 'left',
          wordBreak: 'break-all',
          minHeight: { xs: 40, sm: 48 },
          display: 'flex',
          alignItems: verificationCode ? 'center' : 'flex-start',
          justifyContent: verificationCode ? 'center' : 'flex-start',
        }}
      >
        {codeLoading ? <CircularProgress size={20} /> : displayContent}
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
        {codeLoading
          ? '正在获取验证码，请稍候...'
          : `第二步：点击"复制${verificationCode ? '验证码' : '内容'}"按钮复制${
              verificationCode ? '验证码' : '短信内容'
            }`}
      </Typography>
    </Box>
  );
}
