'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import { Message } from '@/types';
import { userApi } from '@/lib/utils/api-client';
import { Message } from '@prisma/client';

// 分页信息类型
interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export default function MessagesPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [messages, setMessages] = useState<Message[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        pageSize: 2,
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
                // 调试日志
                console.log('API响应数据:', response);

                if (append) {
                    setMessages((prev) => [...prev, ...(response.data || [])]);
                } else {
                    setMessages(response.data || []);
                }

                if (response.pagination) {
                    setPagination(response.pagination);
                } else {
                    console.warn('API响应缺少分页信息');
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
    const btnClass = 'px-3 py-1 mx-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600';
    const activeBtnClass = 'bg-blue-500 text-white';

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="space-y-6">
                    {/* 标题 */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                我的消息
                            </h2>
                            <a
                                href="/user"
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            >
                                返回用户中心
                            </a>
                        </div>
                    </div>

                    {/* 消息列表 */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="p-6 border-b dark:border-gray-700">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
                                <div className="flex items-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        消息列表
                                    </h3>
                                    <button
                                        onClick={refreshData}
                                        disabled={isLoading}
                                        className="ml-2 p-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                                        title="刷新数据"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            className="h-5 w-5"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                {/* 搜索框 */}
                                <div className="flex-1 md:max-w-xs md:ml-4">
                                    <form onSubmit={handleSearch} className="flex">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="搜索消息内容"
                                            className="flex-1 px-4 py-2 border dark:border-gray-600 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        {searchQuery && (
                                            <button
                                                type="button"
                                                onClick={clearSearch}
                                                className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
                                            >
                                                ×
                                            </button>
                                        )}
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 disabled:opacity-50"
                                            disabled={isSearching}
                                        >
                                            {isSearching ? '搜索中...' : '搜索'}
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* 搜索结果统计 */}
                            {searchQuery && (
                                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    搜索 "{searchQuery}" 找到 {messages.length} 个结果
                                </div>
                            )}
                        </div>
                        <div className="divide-y dark:divide-gray-700">
                            {messages.map(message => (
                                <div key={message.id} className="p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <div className="space-y-2">
                                        <p className="font-medium text-gray-800 dark:text-gray-200">
                                            {message.smsContent || '无内容'}
                                        </p>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                                            <div>
                                                <span className="font-semibold">ID: </span>
                                                <span>{message.id}</span>
                                            </div>
                                            {message.username && (
                                                <div>
                                                    <span className="font-semibold">用户: </span>
                                                    <span>{message.username}</span>
                                                </div>
                                            )}
                                            <div>
                                                <span className="font-semibold">时间: </span>
                                                <span>{message.recTime || '未知时间'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {messages.length === 0 && (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                    {isLoading
                                        ? '加载中...'
                                        : '暂无消息'}
                                </div>
                            )}
                        </div>

                        {/* 分页控件 */}
                        {pagination.totalPages > 1 && (
                            <div className="p-4 flex justify-center items-center">
                                <div className="flex flex-wrap justify-center">
                                    <button
                                        onClick={() => changePage(pagination.page - 1)}
                                        disabled={pagination.page === 1 || isLoadingMore}
                                        className={`${btnClass} disabled:opacity-50`}
                                    >
                                        上一页
                                    </button>

                                    {start > 1 && (
                                        <button
                                            onClick={() => changePage(1)}
                                            className={btnClass}
                                        >
                                            1
                                        </button>
                                    )}
                                    {start > 2 && <span className="px-3 py-1">...</span>}

                                    {Array.from({ length: end - start + 1 }, (_, i) => start + i).map(page => (
                                        <button
                                            key={page}
                                            onClick={() => changePage(page)}
                                            className={`${btnClass} ${pagination.page === page ? activeBtnClass : ''}`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    {end < pagination.totalPages - 1 && <span className="px-3 py-1">...</span>}
                                    {end < pagination.totalPages && (
                                        <button
                                            onClick={() => changePage(pagination.totalPages)}
                                            className={btnClass}
                                        >
                                            {pagination.totalPages}
                                        </button>
                                    )}

                                    <button
                                        onClick={() => changePage(pagination.page + 1)}
                                        disabled={pagination.page === pagination.totalPages || isLoadingMore}
                                        className={`${btnClass} disabled:opacity-50`}
                                    >
                                        下一页
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 加载状态 */}
                        {isLoadingMore && (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">加载中...</div>
                        )}
                    </div>

                    {/* 加载状态指示器 */}
                    {isLoading && (
                        <div className="fixed inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center z-50">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                            <div className="ml-3 text-blue-500 font-medium">加载中...</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}