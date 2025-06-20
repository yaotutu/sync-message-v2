'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { copyToClipboard } from '@/lib/utils/clipboard';

// 从短信内容中提取验证码的函数
const extractVerificationCode = (content: string | null | undefined): string | null => {
    // 处理空值情况
    if (!content) return null;

    // 常见的验证码格式匹配
    const patterns = [
        /验证码[为是：:]\s*([0-9]{4,6})/i,
        /验证码[：:]\s*([0-9]{4,6})/i,
        /验证码\s*[为是:：]?\s*([0-9]{4,6})/i,
        /code[：:]\s*([0-9]{4,6})/i,
        /[验证校验]证码[^0-9]*([0-9]{4,6})/i,
        /[^0-9]([0-9]{4,6})[^0-9]/
    ];

    for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    // 如果没有匹配到，尝试匹配任何4-6位数字
    const anyNumberMatch = content.match(/[^0-9]([0-9]{4,6})[^0-9]/);
    if (anyNumberMatch && anyNumberMatch[1]) {
        return anyNumberMatch[1];
    }

    return null;
};

interface Message {
    content: string;
    receivedAt: number;
    recTime: string | null;
}

interface ApiResponse {
    success: boolean;
    firstUsedAt: number | null;
    message: Message | null;
    error?: string;
}

function ViewPageContent() {
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState<Message | null>(null);
    const [appName, setAppName] = useState<string>('');
    const [phone, setPhone] = useState<string | null>(null);
    const [verificationCode, setVerificationCode] = useState<string | null>(null);
    const [firstUsedAt, setFirstUsedAt] = useState<number | null>(null);
    const [copyStatus, setCopyStatus] = useState<{ phone: string, code: string }>({
        phone: '',
        code: ''
    });

    // 自动刷新相关状态
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [countdown, setCountdown] = useState(5);
    const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

    // 更新验证码
    useEffect(() => {
        if (message) {
            const code = extractVerificationCode(message.content);
            setVerificationCode(code ?? message.content);
        } else {
            setVerificationCode(null);
        }
    }, [message]);

    const loadMessages = useCallback(async (cardKey: string, appName: string, phone: string | null) => {
        setIsLoading(true);
        setError('');
        try {
            console.log('加载消息，参数:', { cardKey, appName, phone });

            const params = new URLSearchParams();
            params.append('cardKey', cardKey);
            params.append('appName', encodeURIComponent(appName));
            if (phone) {
                params.append('phone', phone);
            }

            const url = `/api/public/messages?${params.toString()}`;
            console.log('请求URL:', url);

            const response = await fetch(url);
            const data: ApiResponse = await response.json();

            if (data.success) {
                setMessage(data.message);
                setFirstUsedAt(data.firstUsedAt);
                setLastRefreshTime(new Date());
            } else {
                setError(data.error || '加载消息失败');
            }
        } catch (error) {
            console.error('加载消息错误:', error);
            setError('加载消息失败，请检查网络连接');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 自动刷新效果
    useEffect(() => {
        const cardKey = searchParams.get('cardKey');
        const appNameParam = searchParams.get('appName');
        const phoneParam = searchParams.get('phone');

        if (!cardKey || !appNameParam || !autoRefresh) return;

        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    loadMessages(cardKey, appNameParam, phoneParam);
                    return 5;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [searchParams, autoRefresh, loadMessages]);

    useEffect(() => {
        const cardKey = searchParams.get('cardKey');
        const appNameParam = searchParams.get('appName');
        const phoneParam = searchParams.get('phone');

        if (!cardKey || !appNameParam) {
            setError('无效的链接参数');
            setIsLoading(false);
            return;
        }

        setAppName(appNameParam);
        setPhone(phoneParam);
        loadMessages(cardKey, appNameParam, phoneParam);
    }, [searchParams, loadMessages]);

    // 复制文本到剪贴板
    const handleCopy = async (text: string, type: 'phone' | 'code') => {
        await copyToClipboard(
            text,
            () => {
                setCopyStatus(prev => ({
                    ...prev,
                    [type]: '复制成功!'
                }));
                // 2秒后清除复制状态
                setTimeout(() => {
                    setCopyStatus(prev => ({
                        ...prev,
                        [type]: ''
                    }));
                }, 2000);
            },
            () => {
                setCopyStatus(prev => ({
                    ...prev,
                    [type]: '复制失败'
                }));
            }
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-gray-600 dark:text-gray-400">加载中...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-red-500 dark:text-red-400">{error}</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* 自动刷新控制 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-4 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => setAutoRefresh(!autoRefresh)}
                                className={`px-4 py-2 rounded transition-colors ${autoRefresh
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                                    }`}
                            >
                                {autoRefresh ? '自动刷新中' : '已暂停刷新'}
                            </button>
                            {autoRefresh && (
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {countdown}秒后刷新
                                </span>
                            )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            上次刷新: {lastRefreshTime.toLocaleTimeString()}
                        </div>
                    </div>
                </div>

                {/* 快速复制卡片 */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
                    <div className="p-6 border-b dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                            {appName} - 快速复制
                        </h2>
                        {firstUsedAt && (
                            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                首次使用时间：{new Date(firstUsedAt).toLocaleString()}
                            </p>
                        )}
                    </div>
                    <div className="p-6 space-y-6">
                        {/* 手机号部分 */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">手机号</h3>
                                <button
                                    onClick={() => phone && handleCopy(phone, 'phone')}
                                    disabled={!phone}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {copyStatus.phone || '复制账号'}
                                </button>
                            </div>
                            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-lg">
                                {phone || '无手机号'}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                第一步：点击"复制账号"按钮复制手机号
                            </p>
                        </div>

                        {/* 验证码部分 */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">验证码</h3>
                                <button
                                    onClick={() => verificationCode && handleCopy(verificationCode, 'code')}
                                    disabled={!verificationCode}
                                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {copyStatus.code || '复制验证码'}
                                </button>
                            </div>
                            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg font-mono text-lg text-center">
                                {verificationCode || '未找到验证码'}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                第二步：点击"复制验证码"按钮复制验证码
                            </p>
                        </div>
                    </div>
                </div>

                {/* 消息内容 */}
                {/* {message && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="p-6 border-b dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                消息内容
                            </h2>
                        </div>
                        <div className="p-4">
                            <div className="space-y-2">
                                <div className="text-gray-900 dark:text-white break-words">
                                    {message.content}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                    接收时间：{message.recTime || new Date(message.receivedAt).toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {!message && !isLoading && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center text-gray-500 dark:text-gray-400">
                        {firstUsedAt ? '未找到首次使用时间之后的新消息' : '暂无消息'}
                    </div>
                )} */}
            </div>
        </div>
    );
}

export default function ViewPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-gray-600 dark:text-gray-400">加载中...</div>
            </div>
        }>
            <ViewPageContent />
        </Suspense>
    );
} 