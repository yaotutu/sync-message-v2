import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

/**
 * 验证码弹窗组件
 */
export default function CodeDialog({ open, onClose, code }) {
    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>验证码已获取</DialogTitle>
            <DialogContent>
                <Typography variant="h5" align="center" sx={{ fontWeight: 'bold', letterSpacing: 2 }}>
                    {code}
                </Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary" variant="contained">
                    知道了
                </Button>
            </DialogActions>
        </Dialog>
    );
} 