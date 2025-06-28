import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    Chip,
    IconButton,
    Alert,
    Stack
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { userApi } from '@/lib/utils/api-client';

export default function TagManagerDialog({ open, onClose, onTagsChange }) {
    const [tags, setTags] = useState([]);
    const [newTag, setNewTag] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // 加载用户标签
    useEffect(() => {
        if (open) {
            loadUserTags();
        }
    }, [open]);

    const loadUserTags = async () => {
        try {
            const data = await userApi.get('/api/user/profile');
            if (data.success) {
                setTags(data.data.cardLinkTags || []);
            }
        } catch {
            setError('加载标签失败');
        }
    };

    // 添加新标签
    const addNewTag = async () => {
        if (!newTag.trim()) {
            setError('标签不能为空');
            return;
        }

        if (newTag.length > 50) {
            setError('标签长度不能超过50个字符');
            return;
        }

        if (tags.includes(newTag.trim())) {
            setError('标签已存在');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const updatedTags = [...tags, newTag.trim()];
            const data = await userApi.patch('/api/user/profile', {
                cardLinkTags: updatedTags
            });

            if (data.success) {
                setTags(updatedTags);
                setNewTag('');
                onTagsChange(updatedTags);
            } else {
                setError(data.message || '添加标签失败');
            }
        } catch {
            setError('添加标签失败，请检查网络连接');
        } finally {
            setLoading(false);
        }
    };

    // 删除标签
    const removeTag = async (tagToRemove) => {
        setLoading(true);
        setError('');

        try {
            const updatedTags = tags.filter(tag => tag !== tagToRemove);
            const data = await userApi.patch('/api/user/profile', {
                cardLinkTags: updatedTags
            });

            if (data.success) {
                setTags(updatedTags);
                onTagsChange(updatedTags);
            } else {
                setError(data.message || '删除标签失败');
            }
        } catch {
            setError('删除标签失败，请检查网络连接');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setNewTag('');
        setError('');
        onClose();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            addNewTag();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                标签管理
            </DialogTitle>

            <DialogContent>
                <Stack spacing={3}>
                    {/* 错误提示 */}
                    {error && (
                        <Alert severity="error" onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    {/* 添加新标签 */}
                    <Box>
                        <Typography variant="subtitle2" mb={1}>
                            添加新标签
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField
                                size="small"
                                value={newTag}
                                onChange={(e) => setNewTag(e.target.value)}
                                placeholder="输入新标签名称"
                                onKeyPress={handleKeyPress}
                                disabled={loading}
                                sx={{ flex: 1 }}
                            />
                            <Button
                                variant="contained"
                                onClick={addNewTag}
                                disabled={!newTag.trim() || loading}
                                startIcon={<AddIcon />}
                            >
                                添加
                            </Button>
                        </Box>
                    </Box>

                    {/* 现有标签列表 */}
                    <Box>
                        <Typography variant="subtitle2" mb={1}>
                            现有标签 ({tags.length})
                        </Typography>
                        {tags.length > 0 ? (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {tags.map((tag) => (
                                    <Chip
                                        key={tag}
                                        label={tag}
                                        onDelete={() => removeTag(tag)}
                                        deleteIcon={<DeleteIcon />}
                                        disabled={loading}
                                        color="primary"
                                        variant="outlined"
                                    />
                                ))}
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                暂无标签，请添加新标签
                            </Typography>
                        )}
                    </Box>
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                    关闭
                </Button>
            </DialogActions>
        </Dialog>
    );
} 