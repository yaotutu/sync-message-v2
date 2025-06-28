'use client';

import { Button, Box, Typography, Chip } from '@mui/material';
import { footerControl, useFooterStore } from '@/store';

export default function FooterControlExample() {
    const { visible } = useFooterStore();

    return (
        <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
                Footer控制示例
            </Typography>

            <Typography variant="body2" sx={{ mb: 2 }}>
                当前Footer状态:
                <Chip
                    label={visible ? '显示' : '隐藏'}
                    color={visible ? 'success' : 'error'}
                    size="small"
                    sx={{ ml: 1 }}
                />
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => footerControl.show()}
                    disabled={visible}
                >
                    显示Footer
                </Button>

                <Button
                    variant="contained"
                    color="secondary"
                    onClick={() => footerControl.hide()}
                    disabled={!visible}
                >
                    隐藏Footer
                </Button>

                <Button
                    variant="outlined"
                    onClick={() => footerControl.toggle()}
                >
                    切换Footer
                </Button>
            </Box>

            <Typography variant="body2" color="text.secondary">
                在任何页面都可以调用这些函数来控制Footer：
            </Typography>

            <Box sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                <div>import {`{ footerControl }`} from '@/store';</div>
                <div>footerControl.show();    // 显示Footer</div>
                <div>footerControl.hide();    // 隐藏Footer</div>
                <div>footerControl.toggle();  // 切换Footer</div>
                <div>footerControl.setVisible(false);  // 设置状态</div>
            </Box>
        </Box>
    );
} 