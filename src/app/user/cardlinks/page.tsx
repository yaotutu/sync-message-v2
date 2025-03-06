'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppTemplate, CardLink } from '@/types';
import { userApi } from '@/lib/api-client';

// 卡密状态类型
type CardLinkStatus = 'all' | 'used' | 'unused';

// 分页信息类型
interface Pagination {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
}

export default function CardLinksPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [templates, setTemplates] = useState<AppTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [phones, setPhones] = useState<string[]>(['']);
    const [cardLinks, setCardLinks] = useState<CardLink[]>([]);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [linkCount, setLinkCount] = useState(100);
    // 添加卡密状态过滤
    const [statusFilter, setStatusFilter] = useState<CardLinkStatus>('unused');
    const [filteredCardLinks, setFilteredCardLinks] = useState<CardLink[]>([]);
    // 添加分页相关状态
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0
    });
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    // 添加搜索相关状态
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // 检查登录状态
    useEffect(() => {
        const storedAuth = localStorage.getItem('user_auth');
        if (storedAuth) {
            try {
                const auth = JSON.parse(storedAuth);
                setUsername(auth.username);
                setPassword(auth.password);
                loadTemplates();
                // 不在这里调用loadCardLinks，避免重复加载
            } catch (e) {
                console.error('Failed to parse auth:', e);
                router.push('/user/login');
            }
        } else {
            router.push('/user/login');
        }
    }, []);

    // 当用户名和密码设置后，加载卡密链接
    useEffect(() => {
        if (username && password) {
            loadCardLinks(1);
        }
    }, [username, password]);

    // 根据状态和搜索关键词过滤卡密链接
    useEffect(() => {
        let filtered = cardLinks;

        // 手动确保数据与当前过滤状态一致
        if (statusFilter === 'unused') {
            // 如果是未使用状态，过滤掉所有已使用的卡密
            const beforeCount = filtered.length;
            filtered = filtered.filter(link => !link.firstUsedAt);
            const afterCount = filtered.length;
            if (beforeCount !== afterCount) {
                console.warn(`前端额外过滤: 在"未使用"状态下移除了 ${beforeCount - afterCount} 个已使用的卡密`);
            }
        } else if (statusFilter === 'used') {
            // 如果是已使用状态，过滤掉所有未使用的卡密
            const beforeCount = filtered.length;
            filtered = filtered.filter(link => link.firstUsedAt);
            const afterCount = filtered.length;
            if (beforeCount !== afterCount) {
                console.warn(`前端额外过滤: 在"已使用"状态下移除了 ${beforeCount - afterCount} 个未使用的卡密`);
            }
        }

        // 应用搜索过滤
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(link =>
                link.url.toLowerCase().includes(query) ||
                link.key.toLowerCase().includes(query) ||
                link.appName.toLowerCase().includes(query) ||
                (Array.isArray(link.phones) && link.phones.some(phone =>
                    phone.toLowerCase().includes(query)
                ))
            );
        }

        console.log(`过滤后的卡密链接数量: ${filtered.length}, 状态: ${statusFilter}`);
        // 调试信息：检查数据中是否有firstUsedAt
        const usedCount = filtered.filter(link => link.firstUsedAt).length;
        const unusedCount = filtered.filter(link => !link.firstUsedAt).length;
        console.log(`数据统计 - 已使用: ${usedCount}, 未使用: ${unusedCount}`);

        setFilteredCardLinks(filtered);
    }, [cardLinks, searchQuery, statusFilter]);

    // 加载模板列表
    const loadTemplates = async () => {
        try {
            const data = await userApi.get('/api/public/templates');
            if (data.success) {
                setTemplates(data.data || []);
            } else {
                setError(data.message || '加载模板失败');
            }
        } catch (error) {
            console.error('Load templates error:', error);
            setError('加载模板失败，请检查网络连接');
        }
    };

    // 加载已生成的卡密链接
    const loadCardLinks = async (page: number, append: boolean = false, overrideStatus?: CardLinkStatus) => {
        try {
            setIsLoading(true);
            setIsLoadingMore(append);
            setError('');

            // 创建一个请求ID，用于防止竞态条件
            const requestId = Date.now();
            (window as any).lastCardLinksRequestId = requestId;

            // 使用传入的状态覆盖或使用当前状态
            let currentStatus: CardLinkStatus = overrideStatus || statusFilter;

            // 检查状态参数是否有效
            if (!['all', 'used', 'unused'].includes(currentStatus)) {
                console.error(`无效的状态参数: ${currentStatus}，使用默认值: unused`);
                currentStatus = 'unused';
            }

            // 构建API请求URL，添加状态过滤参数和时间戳防止缓存
            const apiUrl = `/api/user/cardlinks?page=${page}&pageSize=${pagination.pageSize}${currentStatus !== 'all' ? `&status=${currentStatus}` : ''}&_t=${Date.now()}`;

            // 创建一个调试信息组
            console.group(`API请求 (ID: ${requestId})`);
            console.log(`URL: ${apiUrl}`);
            console.log(`状态过滤: ${currentStatus}`);
            console.log(`请求头: username=${username ? '已提供' : '未提供'}, password=${password ? '已提供' : '未提供'}`);
            console.groupEnd();

            const data = await userApi.get(apiUrl, { username, password });

            // 如果这不是最新的请求，则忽略结果
            if ((window as any).lastCardLinksRequestId !== requestId) {
                console.log(`忽略过时的请求结果，请求ID: ${requestId}`);
                return;
            }

            // 创建一个调试信息组
            console.group(`API响应 (ID: ${requestId})`);
            console.log(`URL: ${apiUrl}`);
            console.log(`状态过滤: ${currentStatus}`);
            console.log(`数据条数: ${data.data?.length || 0}`);

            // 调试信息：检查返回的数据中是否有firstUsedAt
            if (data.data && data.data.length > 0) {
                const usedCount = data.data.filter((link: CardLink) => link.firstUsedAt).length;
                const unusedCount = data.data.filter((link: CardLink) => !link.firstUsedAt).length;
                console.log(`数据统计 - 已使用: ${usedCount}, 未使用: ${unusedCount}`);

                // 验证返回的数据是否符合当前的过滤状态
                if (currentStatus === 'used' && unusedCount > 0) {
                    console.warn(`警告: 在"已使用"过滤状态下收到了未使用的卡密链接`);
                } else if (currentStatus === 'unused' && usedCount > 0) {
                    console.warn(`警告: 在"未使用"过滤状态下收到了已使用的卡密链接`);

                    // 如果是未使用状态但返回了已使用的卡密，手动过滤掉这些卡密
                    if (currentStatus === 'unused') {
                        console.log(`手动过滤掉已使用的卡密链接，原数量: ${data.data.length}`);
                        data.data = data.data.filter((link: CardLink) => !link.firstUsedAt);
                        console.log(`过滤后数量: ${data.data.length}`);
                    }
                }
            }
            console.groupEnd();

            if (data.success) {
                if (append) {
                    setCardLinks(prev => [...prev, ...data.data]);
                } else {
                    setCardLinks(data.data || []);
                }

                if (data.pagination) {
                    setPagination(data.pagination);
                }
            } else {
                setError(data.message || '加载卡密链接失败');
            }
        } catch (error) {
            console.error('Load card links error:', error);
            setError('加载卡密链接失败，请检查网络连接');
        } finally {
            setIsLoading(false);
            setIsLoadingMore(false);
        }
    };

    // 处理搜索
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSearching(true);

        // 搜索是在前端进行的，不需要重新请求API
        // 只需要更新搜索状态即可

        setIsSearching(false);
    };

    // 清除搜索
    const clearSearch = () => {
        setSearchQuery('');
    };

    // 加载更多卡密链接
    const loadMoreCardLinks = () => {
        if (pagination.page < pagination.totalPages) {
            loadCardLinks(pagination.page + 1, true);
        }
    };

    // 切换页码
    const changePage = (newPage: number) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            loadCardLinks(newPage);
        }
    };

    // 添加手机号输入框
    const addPhoneInput = () => {
        setPhones([...phones, '']);
    };

    // 删除手机号输入框
    const removePhoneInput = (index: number) => {
        if (phones.length > 1) {
            const newPhones = phones.filter((_, i) => i !== index);
            setPhones(newPhones);
        }
    };

    // 更新手机号
    const updatePhone = (index: number, value: string) => {
        const newPhones = [...phones];
        newPhones[index] = value;
        setPhones(newPhones);
    };

    // 验证手机号格式
    const isValidPhone = (phone: string): boolean => {
        return /^1\d{10}$/.test(phone);
    };

    // 生成卡密链接
    const generateCardLink = async () => {
        if (!selectedTemplate) {
            setError('请选择应用模板');
            return;
        }

        // 验证手机号（如果有输入的话）
        const validPhones = phones.filter(phone => phone.trim() && isValidPhone(phone));
        const hasInvalidInput = phones.some(phone => phone.trim() && !isValidPhone(phone));

        if (hasInvalidInput) {
            setError('请检查输入的手机号格式');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            // 获取选中模板的名称
            const templateName = templates.find(t => t.id === selectedTemplate)?.name;
            if (!templateName) {
                setError('无法获取所选模板的名称');
                setIsLoading(false);
                return;
            }

            // 创建多个卡链接
            const creationPromises = [];
            for (let i = 0; i < linkCount; i++) {
                // 如果有有效的手机号，则使用；否则不包含手机号
                const phoneToUse = validPhones.length > 0
                    ? (validPhones.length === 1
                        ? validPhones
                        : [validPhones[i % validPhones.length]])
                    : undefined;

                creationPromises.push(
                    userApi.post('/api/user/cardlinks', {
                        appName: templateName,
                        phones: phoneToUse,
                        templateId: selectedTemplate
                    }, { username, password })
                );
            }

            // 等待所有创建请求完成
            const results = await Promise.all(creationPromises);

            // 检查是否有失败的请求
            const failedResults = results.filter(result => !result.success);
            if (failedResults.length > 0) {
                setError(`创建卡链接部分失败: ${failedResults[0].message}`);
            } else {
                // 提取并复制所有新生成的链接
                const newLinks = results.map(result => result.data.url).join('\n');
                try {
                    await navigator.clipboard.writeText(newLinks);
                    alert(`已成功生成 ${results.length} 个链接并复制到剪贴板！`);
                } catch (error) {
                    console.error('复制链接失败:', error);
                    alert('链接生成成功，但复制到剪贴板失败，请手动复制。');
                }

                // 重置表单
                setSelectedTemplate('');
                setPhones(['']);
                setLinkCount(100);

                // 重新加载卡链接列表
                await loadCardLinks(1);
            }
        } catch (error) {
            console.error('Generate card link error:', error);
            setError('生成卡密链接失败，请检查网络连接');
        } finally {
            setIsLoading(false);
        }
    };

    // 生成分页按钮
    const renderPaginationButtons = () => {
        const buttons = [];
        const maxButtons = 5; // 最多显示的按钮数

        let startPage = Math.max(1, pagination.page - Math.floor(maxButtons / 2));
        let endPage = Math.min(pagination.totalPages, startPage + maxButtons - 1);

        // 调整startPage，确保显示maxButtons个按钮
        if (endPage - startPage + 1 < maxButtons && startPage > 1) {
            startPage = Math.max(1, endPage - maxButtons + 1);
        }

        // 添加首页按钮
        if (startPage > 1) {
            buttons.push(
                <button
                    key="first"
                    onClick={() => changePage(1)}
                    className="px-3 py-1 mx-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                    首页
                </button>
            );
        }

        // 添加页码按钮
        for (let i = startPage; i <= endPage; i++) {
            buttons.push(
                <button
                    key={i}
                    onClick={() => changePage(i)}
                    className={`px-3 py-1 mx-1 rounded-md ${pagination.page === i
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                        }`}
                >
                    {i}
                </button>
            );
        }

        // 添加末页按钮
        if (endPage < pagination.totalPages) {
            buttons.push(
                <button
                    key="last"
                    onClick={() => changePage(pagination.totalPages)}
                    className="px-3 py-1 mx-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                    末页
                </button>
            );
        }

        return buttons;
    };

    // 修改状态过滤按钮的点击处理函数
    const handleStatusFilterChange = (newStatus: CardLinkStatus) => {
        if (statusFilter !== newStatus) {
            setIsLoading(true); // 设置加载状态
            setError(''); // 清除错误信息
            console.log(`切换状态过滤: ${statusFilter} -> ${newStatus}`);

            // 先更新状态，然后再加载数据
            setStatusFilter(newStatus);

            // 使用setTimeout确保状态更新后再加载数据
            setTimeout(() => {
                // 再次检查当前状态，确保使用最新的状态值
                console.log(`准备加载数据，当前状态过滤: ${newStatus}`);
                loadCardLinks(1, false, newStatus);
            }, 10);
        }
    };

    // 手动刷新数据
    const refreshData = () => {
        setError('');
        loadCardLinks(1);
    };

    // 删除卡密链接
    const deleteCardLink = async (key: string) => {
        if (!confirm('确定要删除这个卡密链接吗？删除后无法恢复。')) {
            return;
        }

        try {
            setIsLoading(true);
            const response = await userApi.delete(`/api/user/cardlinks/${key}`, { username, password });

            if (response.success) {
                // 重新加载列表
                await loadCardLinks(1);
            } else {
                setError(response.message || '删除失败');
            }
        } catch (error) {
            console.error('Delete card link error:', error);
            setError('删除卡密链接失败，请检查网络连接');
        } finally {
            setIsLoading(false);
        }
    };

    // 更新链接数量输入处理函数
    const handleLinkCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 100;
        setLinkCount(Math.max(1, value)); // 确保至少生成1个链接
    };

    // 批量复制链接到剪贴板
    const copyLinksToClipboard = async (links: CardLink[]) => {
        try {
            const linksText = links.map(link => link.url).join('\n');
            await navigator.clipboard.writeText(linksText);
            alert('已成功复制所有链接到剪贴板！');
        } catch (error) {
            console.error('复制链接失败:', error);
            alert('复制链接失败，请手动复制。');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="space-y-6">
                    {/* 标题 */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                            带链接卡密管理
                        </h2>

                        {/* 应用模板选择 */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    选择应用模板 <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={selectedTemplate}
                                    onChange={(e) => setSelectedTemplate(e.target.value)}
                                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="">请选择应用</option>
                                    {templates.map(template => (
                                        <option key={template.id} value={template.id}>
                                            {template.name} - {template.description}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 手机号输入 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    手机号列表
                                </label>
                                <div className="space-y-2">
                                    {phones.map((phone, index) => (
                                        <div key={index} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={phone}
                                                onChange={(e) => updatePhone(index, e.target.value)}
                                                placeholder="请输入手机号（11位数字，以1开头）"
                                                className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${phone && !isValidPhone(phone)
                                                    ? 'border-red-500 dark:border-red-500'
                                                    : 'border-gray-300 dark:border-gray-600'
                                                    }`}
                                            />
                                            <button
                                                onClick={() => removePhoneInput(index)}
                                                className="px-4 py-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                                disabled={phones.length <= 1 || isLoading}
                                            >
                                                删除
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={addPhoneInput}
                                    className="mt-2 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                    disabled={isLoading}
                                >
                                    添加手机号
                                </button>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    有效手机号数量: {phones.filter(p => p.trim() && isValidPhone(p)).length}
                                </p>
                            </div>

                            {/* 链接数量选择 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    生成链接数量 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={linkCount}
                                    onChange={handleLinkCountChange}
                                    min="1"
                                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    disabled={isLoading}
                                />
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    默认生成100个链接，可以自定义数量
                                </p>
                            </div>

                            {/* 生成按钮 */}
                            <div>
                                <button
                                    onClick={generateCardLink}
                                    disabled={isLoading}
                                    className="w-full px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:bg-blue-300 dark:disabled:bg-blue-400 transition-all"
                                >
                                    {isLoading ? '生成中...' : `生成 ${linkCount} 个卡密链接`}
                                </button>
                            </div>

                            {error && (
                                <div className="text-red-500 dark:text-red-400 text-sm">
                                    {error.replace('请至少输入一个有效的手机号码', '请检查输入的手机号格式')}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 卡密链接列表 */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="p-6 border-b dark:border-gray-700">
                            <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
                                <div className="flex items-center">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                        已生成的卡密链接
                                    </h3>
                                    <button
                                        onClick={refreshData}
                                        disabled={isLoading}
                                        className="ml-2 p-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                                        title="刷新数据"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
                                            placeholder="搜索链接、卡密、应用或手机号"
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

                                {/* 状态过滤按钮 */}
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleStatusFilterChange('all')}
                                        className={`px-3 py-1 text-sm rounded-md ${statusFilter === 'all'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}
                                        disabled={isLoading}
                                    >
                                        全部
                                    </button>
                                    <button
                                        onClick={() => handleStatusFilterChange('unused')}
                                        className={`px-3 py-1 text-sm rounded-md ${statusFilter === 'unused'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}
                                        disabled={isLoading}
                                    >
                                        未使用
                                    </button>
                                    <button
                                        onClick={() => handleStatusFilterChange('used')}
                                        className={`px-3 py-1 text-sm rounded-md ${statusFilter === 'used'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                            }`}
                                        disabled={isLoading}
                                    >
                                        已使用
                                    </button>
                                </div>
                            </div>

                            {/* 搜索结果统计 */}
                            {searchQuery && (
                                <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    搜索 "{searchQuery}" 找到 {filteredCardLinks.length} 个结果
                                </div>
                            )}
                        </div>
                        <div className="divide-y dark:divide-gray-700">
                            {filteredCardLinks.map((cardLink) => (
                                <div key={cardLink.key} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                应用：{cardLink.appName}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                卡密：{cardLink.key}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                手机号：{Array.isArray(cardLink.phones)
                                                    ? cardLink.phones.join(', ')
                                                    : typeof cardLink.phones === 'string'
                                                        ? cardLink.phones
                                                        : '无手机号'
                                                }
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                创建时间：{new Date(cardLink.createdAt).toLocaleString()}
                                            </div>
                                            {/* 只在非"未使用"状态或确实有使用时间时显示使用时间 */}
                                            {(statusFilter !== 'unused' && cardLink.firstUsedAt) && (
                                                <div className="text-sm text-green-600 dark:text-green-400">
                                                    首次使用：{new Date(cardLink.firstUsedAt).toLocaleString()}
                                                </div>
                                            )}
                                            <div className="font-mono text-sm break-all">
                                                <a
                                                    href={cardLink.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    {cardLink.url}
                                                </a>
                                            </div>
                                        </div>
                                        <div className="flex flex-col space-y-2">
                                            <button
                                                onClick={() => navigator.clipboard.writeText(cardLink.url)}
                                                className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                复制链接
                                            </button>
                                            {!cardLink.firstUsedAt && (
                                                <button
                                                    onClick={() => deleteCardLink(cardLink.key)}
                                                    className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                                    disabled={isLoading}
                                                >
                                                    删除
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredCardLinks.length === 0 && (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                    {isLoading ? '加载中...' :
                                        cardLinks.length === 0
                                            ? '暂无卡密链接'
                                            : searchQuery
                                                ? `没有找到包含 "${searchQuery}" 的卡密链接`
                                                : '没有符合条件的卡密链接'
                                    }
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
                                        className="px-3 py-1 mx-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                                    >
                                        上一页
                                    </button>

                                    {renderPaginationButtons()}

                                    <button
                                        onClick={() => changePage(pagination.page + 1)}
                                        disabled={pagination.page === pagination.totalPages || isLoadingMore}
                                        className="px-3 py-1 mx-1 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                                    >
                                        下一页
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* 加载状态 */}
                        {isLoadingMore && (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                加载中...
                            </div>
                        )}

                        {/* 添加批量复制按钮 */}
                        {filteredCardLinks.length > 0 && (
                            <div className="p-4 border-t dark:border-gray-700">
                                <button
                                    onClick={() => copyLinksToClipboard(filteredCardLinks)}
                                    className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 transition-all"
                                    disabled={isLoading}
                                >
                                    复制全部链接到剪贴板
                                </button>
                            </div>
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