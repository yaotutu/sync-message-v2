'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Box,
    Typography,
    Paper,
    TextField,
    Button,
    IconButton,
    Divider,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    Tooltip,
    Stack
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    Sms as SmsIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Schedule as ScheduleIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { userApi } from '@/lib/utils/api-client';

// 消息类型定义（基于Prisma模型）
interface Message {
    id: number;
    username: string;
    smsContent: string;
    smsReceivedAt: bigint;
    systemReceivedAt: bigint;
    sourceType: string;
    senderPhone: string | null;
    receiverCard: string | null;
    sourceApp: string | null;
    rawData: string | null;
    createdAt: bigint;
}

// 分页信息类型
interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

// 格式化时间戳为可读时间
const formatTimestamp = (timestamp: string | number | bigint) => {
    if (!timestamp) return '未知时间';

    const date = new Date(Number(timestamp));
    return date.toLocaleString('zh-CN', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// 获取来源类型显示信息
const getSourceTypeInfo = (sourceType: string) => {
    switch (sourceType?.toUpperCase()) {
        case 'SMS':
            return { label: '短信', icon: <SmsIcon fontSize="small" />, color: '#1976d2' };
        case 'EMAIL':
            return { label: '邮箱', icon: <EmailIcon fontSize="small" />, color: '#9c27b0' };
        default:
            return { label: sourceType || '未知', icon: null, color: '#666' };
    }
};

// 格式化手机号显示
const formatPhoneNumber = (phone: string | null) => {
    if (!phone) return '未知设备';

    // 如果是SIM格式，提取手机号
    if (phone.startsWith('SIM')) {
        const match = phone.match(/SIM\d+_(\d+)/);
        return match ? match[1] : phone;
    }

    return phone;
};

export default function MessagesPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
    });
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // 当用户名和密码设置后，加载消息
    useEffect(() => {
        loadMessages(1);
    }, []);

    // 加载消息
    const loadMessages = async (
        page: number,
        append: boolean = false,
        search?: string,
    ) => {
        try {
            setIsLoading(true);
            setIsLoadingMore(append);
            setError('');

            const apiUrl = `/api/user/messages?page=${page}&pageSize=${pagination.pageSize}${search ? `&search=${encodeURIComponent(search)}` : ''
                }&_t=${Date.now()}`;

            const response = await userApi.get(apiUrl);

            if (response.success) {
                if (append) {
                    setMessages((prev) => [...prev, ...(response.data || [])]);
                } else {
                    setMessages(response.data || []);
                }

                if (response.pagination) {
                    setPagination(response.pagination);
                }
            } else {
                setError(response.message || '加载消息失败');
            }
        } catch (error) {
            console.error('Load messages error:', error);
            setError('加载消息失败，请检查网络连接');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    // 处理搜索
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearching(true);
        loadMessages(1, false, searchQuery).finally(() => setIsSearching(false));
    };

    // 清除搜索
    const clearSearch = () => {
        setSearchQuery('');
        loadMessages(1, false, '');
    };

    // 切换页码
    const changePage = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            loadMessages(newPage, false, searchQuery);
        }
    };

    // 手动刷新数据
    const refreshData = () => {
        setError('');
        loadMessages(1, false, searchQuery);
    };

    // 生成分页按钮范围
    const getPaginationRange = () => {
        const maxButtons = 5;
        let start = Math.max(1, pagination.page - Math.floor(maxButtons / 2));
        let end = Math.min(pagination.totalPages, start + maxButtons - 1);

        if (end - start + 1 < maxButtons) {
            start = Math.max(1, end - maxButtons + 1);
        }
        return { start, end };
    };

    const { start, end } = getPaginationRange();

    return (
        <Box sx={{ height: '100%', bgcolor: '#f5f5f5', py: 3 }}>
            <Box sx={{ maxWidth: '900px', mx: 'auto', px: 2 }}>
                {/* 标题栏 */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h4" component="h1" fontWeight="bold" color="#333">
                        我的消息
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        href="/user"
                        sx={{
                            textDecoration: 'none',
                            borderColor: '#ddd',
                            color: '#666',
                            '&:hover': {
                                borderColor: '#999',
                                bgcolor: '#f9f9f9'
                            }
                        }}
                    >
                        返回用户中心
                    </Button>
                </Box>

                {/* 搜索栏 */}
                <Paper sx={{
                    p: 3,
                    mb: 3,
                    bgcolor: 'white',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            fullWidth
                            size="medium"
                            placeholder="搜索消息内容..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    '&:hover fieldset': {
                                        borderColor: '#1976d2',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: '#1976d2',
                                    },
                                }
                            }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            // startIcon={<SearchIcon />}
                            disabled={isSearching}

                        >
                            {isSearching ? '搜索中...' : '搜索'}
                        </Button>
                        {searchQuery && (
                            <IconButton
                                onClick={clearSearch}
                                size="medium"
                                sx={{
                                    color: '#666',
                                    '&:hover': { color: '#1976d2' }
                                }}
                            >
                                <ClearIcon />
                            </IconButton>
                        )}
                        <IconButton
                            onClick={refreshData}
                            disabled={isLoading}
                            sx={{
                                color: '#666',
                                '&:hover': { color: '#1976d2' },
                                '&:disabled': { color: '#ccc' }
                            }}
                            title="刷新数据"
                        >
                            <RefreshIcon />
                        </IconButton>
                    </Box>

                    {/* 搜索结果统计 */}
                    {searchQuery && (
                        <Typography variant="body2" color="#666" sx={{ mt: 2 }}>
                            搜索 "{searchQuery}" 找到 {messages.length} 个结果
                        </Typography>
                    )}
                </Paper>

                {/* 消息列表 */}
                <Paper sx={{
                    overflow: 'hidden',
                    bgcolor: 'white',
                    borderRadius: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <List sx={{ p: 0 }}>
                        {messages.map((message, index) => {
                            const sourceTypeInfo = getSourceTypeInfo(message.sourceType);
                            return (
                                <Box key={message.id}>
                                    <ListItem sx={{
                                        flexDirection: 'column',
                                        alignItems: 'stretch',
                                        py: 3,
                                        px: 3,
                                        '&:hover': { bgcolor: '#f8f9fa' }
                                    }}>
                                        {/* 消息内容 */}
                                        <Typography variant="body1" sx={{
                                            mb: 2,
                                            wordBreak: 'break-word',
                                            lineHeight: 1.6,
                                            color: '#333',
                                            fontSize: '16px'
                                        }}>
                                            {message.smsContent || '无内容'}
                                        </Typography>

                                        {/* 消息元信息 */}
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                                            {/* 来源类型 */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                {sourceTypeInfo.icon}
                                                <Typography variant="body2" sx={{ color: sourceTypeInfo.color, fontWeight: 500 }}>
                                                    {sourceTypeInfo.label}
                                                </Typography>
                                            </Box>

                                            {/* 发送设备 */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <PhoneIcon fontSize="small" sx={{ color: '#666' }} />
                                                <Typography variant="body2" color="#666">
                                                    {formatPhoneNumber(message.senderPhone)}
                                                </Typography>
                                            </Box>

                                            {/* 时间信息 */}
                                            {message.smsReceivedAt && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <ScheduleIcon fontSize="small" sx={{ color: '#666' }} />
                                                    <Typography variant="body2" color="#666">
                                                        {formatTimestamp(message.smsReceivedAt)}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {/* 消息ID */}
                                            <Typography variant="body2" color="#999">
                                                ID: {message.id}
                                            </Typography>

                                            {/* 额外信息 */}
                                            {message.sourceApp && (
                                                <Typography variant="body2" color="#666">
                                                    应用: {message.sourceApp}
                                                </Typography>
                                            )}
                                        </Box>
                                    </ListItem>
                                    {index < messages.length - 1 && <Divider sx={{ mx: 3 }} />}
                                </Box>
                            );
                        })}
                    </List>

                    {/* 空状态 */}
                    {messages.length === 0 && (
                        <Box sx={{ p: 6, textAlign: 'center' }}>
                            <Typography color="#999" fontSize="16px">
                                {isLoading ? '加载中...' : '暂无消息'}
                            </Typography>
                        </Box>
                    )}
                </Paper>

                {/* 分页控件 */}
                {pagination.totalPages > 1 && (
                    <Paper sx={{
                        p: 3,
                        mt: 3,
                        bgcolor: 'white',
                        borderRadius: 2,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                            <Button
                                variant="outlined"
                                onClick={() => changePage(pagination.page - 1)}
                                disabled={pagination.page === 1 || isLoadingMore}
                                size="small"
                                sx={{
                                    borderColor: '#ddd',
                                    color: '#666',
                                    '&:hover': {
                                        borderColor: '#1976d2',
                                        color: '#1976d2'
                                    }
                                }}
                            >
                                上一页
                            </Button>

                            {start > 1 && (
                                <Button
                                    variant="outlined"
                                    onClick={() => changePage(1)}
                                    size="small"
                                    sx={{
                                        borderColor: '#ddd',
                                        color: '#666',
                                        '&:hover': {
                                            borderColor: '#1976d2',
                                            color: '#1976d2'
                                        }
                                    }}
                                >
                                    1
                                </Button>
                            )}
                            {start > 2 && <Typography sx={{ px: 1, color: '#999' }}>...</Typography>}

                            {Array.from({ length: end - start + 1 }, (_, i) => start + i).map(page => (
                                <Button
                                    key={page}
                                    variant={pagination.page === page ? "contained" : "outlined"}
                                    onClick={() => changePage(page)}
                                    size="small"
                                    sx={{
                                        ...(pagination.page === page ? {
                                            bgcolor: '#1976d2',
                                            '&:hover': { bgcolor: '#1565c0' }
                                        } : {
                                            borderColor: '#ddd',
                                            color: '#666',
                                            '&:hover': {
                                                borderColor: '#1976d2',
                                                color: '#1976d2'
                                            }
                                        })
                                    }}
                                >
                                    {page}
                                </Button>
                            ))}

                            {end < pagination.totalPages - 1 && <Typography sx={{ px: 1, color: '#999' }}>...</Typography>}
                            {end < pagination.totalPages && (
                                <Button
                                    variant="outlined"
                                    onClick={() => changePage(pagination.totalPages)}
                                    size="small"
                                    sx={{
                                        borderColor: '#ddd',
                                        color: '#666',
                                        '&:hover': {
                                            borderColor: '#1976d2',
                                            color: '#1976d2'
                                        }
                                    }}
                                >
                                    {pagination.totalPages}
                                </Button>
                            )}

                            <Button
                                variant="outlined"
                                onClick={() => changePage(pagination.page + 1)}
                                disabled={pagination.page === pagination.totalPages || isLoadingMore}
                                size="small"
                                sx={{
                                    borderColor: '#ddd',
                                    color: '#666',
                                    '&:hover': {
                                        borderColor: '#1976d2',
                                        color: '#1976d2'
                                    }
                                }}
                            >
                                下一页
                            </Button>
                        </Box>
                    </Paper>
                )}

                {/* 加载状态 */}
                {isLoadingMore && (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                        <CircularProgress size={20} sx={{ color: '#1976d2' }} />
                        <Typography variant="body2" color="#666" sx={{ mt: 1 }}>
                            加载中...
                        </Typography>
                    </Box>
                )}

                {/* 错误提示 */}
                {error && (
                    <Alert severity="error" onClose={() => setError('')} sx={{ mt: 3 }}>
                        {error}
                    </Alert>
                )}

                {/* 加载状态指示器 */}
                {isLoading && (
                    <Box
                        sx={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            bgcolor: 'rgba(255, 255, 255, 0.9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 9999
                        }}
                    >
                        <Box sx={{ textAlign: 'center' }}>
                            <CircularProgress size={40} sx={{ color: '#1976d2' }} />
                            <Typography variant="h6" color="#1976d2" sx={{ mt: 2 }}>
                                加载中...
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
}