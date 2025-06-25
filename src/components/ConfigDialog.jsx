import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Paper,
    IconButton,
    Snackbar,
    Alert,
    Chip,
    CircularProgress,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider
} from '@mui/material';
import { ContentCopy, Close, ExpandMore } from '@mui/icons-material';
import { copyToClipboard } from '@/lib/utils/clipboard';
import { userApi } from '@/lib/utils/api-client';

export default function ConfigDialog({ open, onClose }) {
    const [showSuccess, setShowSuccess] = useState(false);
    const [showError, setShowError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [configData, setConfigData] = useState(null);
    const [error, setError] = useState('');

    // 获取Webhook Server地址
    const getWebhookServerUrl = () => {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        return `${baseUrl}/api/webhook`;
    };

    // 加载配置数据
    const loadConfigData = async () => {
        if (!open) return;

        setLoading(true);
        setError('');

        try {
            const response = await userApi.get('/api/user/config');

            if (response.success) {
                setConfigData(response.data);
            } else {
                setError(response.error || '获取配置信息失败');
            }
        } catch (err) {
            console.error('获取配置信息失败:', err);
            setError('获取配置信息失败，请检查网络连接');
        } finally {
            setLoading(false);
        }
    };

    // 当对话框打开时加载数据
    useEffect(() => {
        if (open) {
            loadConfigData();
        }
    }, [open]);

    // 复制配置文件
    const handleCopyConfig = async () => {
        if (!configData?.configJson) return;

        const success = await copyToClipboard(
            configData.configJson,
            () => setShowSuccess(true),
            () => setShowError(true)
        );
    };

    // 复制单个字段
    const handleCopyField = async (fieldName, fieldValue) => {
        const success = await copyToClipboard(
            fieldValue,
            () => setShowSuccess(true),
            () => setShowError(true)
        );
    };

    // 复制Webhook Server地址
    const handleCopyWebhookUrl = async () => {
        const webhookUrl = getWebhookServerUrl();
        const success = await copyToClipboard(
            webhookUrl,
            () => setShowSuccess(true),
            () => setShowError(true)
        );
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={onClose}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">短信转发器配置文件</Typography>
                        <IconButton onClick={onClose} size="small">
                            <Close />
                        </IconButton>
                    </Box>
                </DialogTitle>

                <DialogContent>
                    {loading ? (
                        <Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : error ? (
                        <Box sx={{ py: 2 }}>
                            <Alert severity="error">{error}</Alert>
                        </Box>
                    ) : configData ? (
                        <>
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    请将以下配置文件复制到您的短信转发器设备中：
                                </Typography>

                                {/* Webhook Server信息 */}
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        backgroundColor: 'blue.50',
                                        borderColor: 'blue.200',
                                        mb: 2
                                    }}
                                >
                                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                        <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold' }}>
                                            Webhook Server
                                        </Typography>
                                        <IconButton
                                            onClick={handleCopyWebhookUrl}
                                            size="small"
                                            title="复制Webhook地址"
                                        >
                                            <ContentCopy fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    <Typography variant="body2" sx={{
                                        fontFamily: 'monospace',
                                        backgroundColor: 'background.paper',
                                        p: 1,
                                        borderRadius: 1,
                                        border: '1px solid',
                                        borderColor: 'divider'
                                    }}>
                                        {getWebhookServerUrl()}
                                    </Typography>
                                </Paper>

                                {/* 配置文件JSON */}
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        backgroundColor: 'grey.50',
                                        position: 'relative'
                                    }}
                                >
                                    <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                                        <Typography variant="subtitle2" color="text.secondary">
                                            完整配置文件
                                        </Typography>
                                        <IconButton
                                            onClick={handleCopyConfig}
                                            size="small"
                                            title="复制完整配置"
                                        >
                                            <ContentCopy fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    <Box
                                        component="pre"
                                        sx={{
                                            fontSize: '0.875rem',
                                            fontFamily: 'monospace',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-all',
                                            margin: 0,
                                            color: 'text.primary',
                                            backgroundColor: 'background.paper',
                                            p: 2,
                                            borderRadius: 1,
                                            border: '1px solid',
                                            borderColor: 'divider'
                                        }}
                                    >
                                        {configData.configJson}
                                    </Box>
                                </Paper>
                            </Box>

                            {/* 配置字段说明 - 默认折叠 */}
                            <Accordion>
                                <AccordionSummary
                                    expandIcon={<ExpandMore />}
                                    aria-controls="config-fields-content"
                                    id="config-fields-header"
                                >
                                    <Typography variant="h6">配置字段说明</Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <Box sx={{ display: 'grid', gap: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip label="username" size="small" color="primary" />
                                            <Typography variant="body2" sx={{ flex: 1 }}>
                                                您的用户名，用于身份识别
                                            </Typography>
                                            <IconButton
                                                onClick={() => handleCopyField('username', configData.config.username)}
                                                size="small"
                                                title="复制用户名"
                                            >
                                                <ContentCopy fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip label="webhookKey" size="small" color="secondary" />
                                            <Typography variant="body2" sx={{ flex: 1 }}>
                                                Webhook密钥，用于安全验证
                                            </Typography>
                                            <IconButton
                                                onClick={() => handleCopyField('webhookKey', configData.config.webhookKey)}
                                                size="small"
                                                title="复制Webhook密钥"
                                            >
                                                <ContentCopy fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip label="smsContent" size="small" color="info" />
                                            <Typography variant="body2" sx={{ flex: 1 }}>
                                                短信内容模板，{'{{MSG}}'} 将被替换为实际短信内容
                                            </Typography>
                                            <IconButton
                                                onClick={() => handleCopyField('smsContent', '{{MSG}}')}
                                                size="small"
                                                title="复制短信内容模板"
                                            >
                                                <ContentCopy fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip label="sourceType" size="small" color="warning" />
                                            <Typography variant="body2" sx={{ flex: 1 }}>
                                                消息来源类型，固定为 SMS
                                            </Typography>
                                            <IconButton
                                                onClick={() => handleCopyField('sourceType', 'SMS')}
                                                size="small"
                                                title="复制来源类型"
                                            >
                                                <ContentCopy fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip label="smsReceivedAt" size="small" color="success" />
                                            <Typography variant="body2" sx={{ flex: 1 }}>
                                                短信接收时间模板，{'{{RECEIVE_TIME}}'} 将被替换为实际时间
                                            </Typography>
                                            <IconButton
                                                onClick={() => handleCopyField('smsReceivedAt', '{{RECEIVE_TIME}}')}
                                                size="small"
                                                title="复制时间模板"
                                            >
                                                <ContentCopy fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip label="timeFormat" size="small" color="default" />
                                            <Typography variant="body2" sx={{ flex: 1 }}>
                                                时间格式，iso 表示 ISO 8601 格式
                                            </Typography>
                                            <IconButton
                                                onClick={() => handleCopyField('timeFormat', 'iso')}
                                                size="small"
                                                title="复制时间格式"
                                            >
                                                <ContentCopy fontSize="small" />
                                            </IconButton>
                                        </Box>

                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Chip label="senderPhone" size="small" color="error" />
                                            <Typography variant="body2" sx={{ flex: 1 }}>
                                                发送者手机号模板，{'{{CARD_SLOT}}'} 将被替换为实际卡槽号
                                            </Typography>
                                            <IconButton
                                                onClick={() => handleCopyField('senderPhone', '{{CARD_SLOT}}')}
                                                size="small"
                                                title="复制手机号模板"
                                            >
                                                <ContentCopy fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Box>
                                </AccordionDetails>
                            </Accordion>
                        </>
                    ) : null}
                </DialogContent>

                <DialogActions>
                    <Button onClick={onClose}>关闭</Button>
                    {configData && (
                        <Button
                            onClick={handleCopyConfig}
                            variant="contained"
                            startIcon={<ContentCopy />}
                        >
                            一键复制配置
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* 成功提示 */}
            <Snackbar
                open={showSuccess}
                autoHideDuration={3000}
                onClose={() => setShowSuccess(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setShowSuccess(false)}>
                    配置已复制到剪贴板
                </Alert>
            </Snackbar>

            {/* 错误提示 */}
            <Snackbar
                open={showError}
                autoHideDuration={3000}
                onClose={() => setShowError(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="error" onClose={() => setShowError(false)}>
                    复制失败，请手动复制
                </Alert>
            </Snackbar>
        </>
    );
} 