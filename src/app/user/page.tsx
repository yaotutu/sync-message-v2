'use client';

import { useState, useEffect } from 'react';
import { User, CardLink, AppTemplate } from '@/types';
import { userApi } from '@/lib/api-client';

export default function UserPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [user, setUser] = useState<User | null>(null);
    const [cardLinks, setCardLinks] = useState<CardLink[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [templates, setTemplates] = useState<AppTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [phoneNumbers, setPhoneNumbers] = useState<string[]>(['']);
    const [linkCount, setLinkCount] = useState(1);
    const [validLinkCounts, setValidLinkCounts] = useState<number[]>([1]);

    useEffect(() => {
        // 检查是否已登录
        const storedAuth = localStorage.getItem('user_auth');
        if (storedAuth) {
            try {
                const auth = JSON.parse(storedAuth);
                if (auth.username && auth.password) {
                    setUsername(auth.username);
                    setPassword(auth.password);
                    setIsLoggedIn(true);
                    loadUserData(auth.username, auth.password);
                    loadTemplates();
                }
            } catch (err) {
                console.error('解析存储的用户信息失败:', err);
                localStorage.removeItem('user_auth');
            }
        }
    }, []);

    // 根据手机号数量计算有效的链接数量
    useEffect(() => {
        const validPhones = phoneNumbers.filter(phone => phone.trim() && /^1\d{10}$/.test(phone));
        const phoneCount = validPhones.length || 1;

        // 生成有效的链接数量选项（手机号数量的倍数）
        const counts = [];
        for (let i = 1; i <= 10; i++) {
            counts.push(i * phoneCount);
        }

        setValidLinkCounts(counts);

        // 如果当前选择的链接数量不是有效的，则重置为第一个有效值
        if (!counts.includes(linkCount)) {
            setLinkCount(counts[0]);
        }
    }, [phoneNumbers, linkCount]);

    // 加载模板列表
    const loadTemplates = async () => {
        try {
            const data = await userApi.get('/api/public/templates');

            if (data.success) {
                setTemplates(data.data || []);
            } else {
                console.error('获取模板列表失败:', data.message);
            }
        } catch (err) {
            console.error('加载模板错误:', err);
        }
    };

    // 加载用户数据
    const loadUserData = async (username: string, password: string) => {
        setLoading(true);
        setError('');

        try {
            // 获取用户信息
            const userData = await userApi.post('/api/user/login', { username, password });

            if (!userData.success) {
                setError(userData.message || '登录失败');
                setIsLoggedIn(false);
                localStorage.removeItem('user_auth');
                setLoading(false);
                return;
            }

            setUser(userData.data);

            // 获取卡链接
            const cardLinksData = await userApi.get('/api/user/cardlinks', { username, password });

            if (cardLinksData.success) {
                setCardLinks(cardLinksData.data || []);
            } else {
                console.error('获取卡链接失败:', cardLinksData.message);
            }
        } catch (err) {
            console.error('加载用户数据错误:', err);
            setError('加载用户数据失败，请检查网络连接');
        } finally {
            setLoading(false);
        }
    };

    // 用户登录
    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            setError('用户名和密码不能为空');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const data = await userApi.post('/api/user/login', {
                username: username.trim(),
                password: password.trim()
            });

            if (data.success) {
                localStorage.setItem('user_auth', JSON.stringify({
                    username: username.trim(),
                    password: password.trim()
                }));
                setIsLoggedIn(true);
                loadUserData(username.trim(), password.trim());
                loadTemplates();
            } else {
                setError(data.message || '登录失败');
            }
        } catch (err) {
            console.error('登录错误:', err);
            setError('登录失败，请检查网络连接');
        } finally {
            setLoading(false);
        }
    };

    // 用户退出登录
    const handleLogout = () => {
        localStorage.removeItem('user_auth');
        setIsLoggedIn(false);
        setUser(null);
        setCardLinks([]);
        setUsername('');
        setPassword('');
    };

    // 添加手机号输入框
    const addPhoneInput = () => {
        setPhoneNumbers([...phoneNumbers, '']);
    };

    // 删除手机号输入框
    const removePhoneInput = (index: number) => {
        if (phoneNumbers.length > 1) {
            const newPhones = phoneNumbers.filter((_, i) => i !== index);
            setPhoneNumbers(newPhones);
        }
    };

    // 更新手机号
    const updatePhoneNumber = (index: number, value: string) => {
        const newPhones = [...phoneNumbers];
        newPhones[index] = value;
        setPhoneNumbers(newPhones);
    };

    // 验证手机号格式
    const isValidPhone = (phone: string): boolean => {
        return /^1\d{10}$/.test(phone);
    };

    // 创建卡链接
    const createCardLink = async () => {
        if (!selectedTemplate) {
            setError('请选择应用模板');
            return;
        }

        // 验证手机号
        const validPhones = phoneNumbers.filter(phone => phone.trim() && isValidPhone(phone));
        if (validPhones.length === 0) {
            setError('请至少输入一个有效的手机号码（11位数字，以1开头）');
            return;
        }

        // 检查链接数量是否是手机号数量的倍数
        if (linkCount % validPhones.length !== 0 && validPhones.length > 1) {
            setError(`链接数量必须是手机号数量(${validPhones.length})的倍数`);
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 获取选中模板的名称
            const templateName = templates.find(t => t.id === selectedTemplate)?.name;
            if (!templateName) {
                setError('无法获取所选模板的名称');
                setLoading(false);
                return;
            }

            // 创建多个卡链接
            const creationPromises = [];
            for (let i = 0; i < linkCount; i++) {
                // 计算这个链接应该使用的手机号
                // 如果只有一个手机号，所有链接都使用这个手机号
                // 如果有多个手机号，则按顺序分配，确保所有手机号都被使用
                const phoneToUse = validPhones.length === 1
                    ? validPhones
                    : [validPhones[i % validPhones.length]];

                creationPromises.push(
                    userApi.post('/api/user/cardlinks', {
                        appName: templateName,
                        phoneNumbers: phoneToUse,
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
                // 重置表单
                setSelectedTemplate('');
                setPhoneNumbers(['']);
                setLinkCount(1);

                // 重新加载卡链接列表
                await loadUserData(username, password);
            }
        } catch (err) {
            console.error('创建卡链接错误:', err);
            setError('创建卡链接失败，请检查网络连接');
        } finally {
            setLoading(false);
        }
    };

    // 复制Webhook密钥
    const copyWebhookKey = async (webhookKey: string) => {
        try {
            await navigator.clipboard.writeText(webhookKey);
            const prevError = error;
            setError('Webhook密钥已复制到剪贴板');
            setTimeout(() => {
                setError(prevError);
            }, 2000);
        } catch (err) {
            console.error('复制失败:', err);
            setError('复制失败，请手动复制');
        }
    };

    // 复制卡链接URL
    const copyCardLinkUrl = async (url: string) => {
        try {
            await navigator.clipboard.writeText(url);
            const prevError = error;
            setError('链接已复制到剪贴板');
            setTimeout(() => {
                setError(prevError);
            }, 2000);
        } catch (err) {
            console.error('复制失败:', err);
            setError('复制失败，请手动复制');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                {isLoggedIn ? (
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">用户中心</h1>
                                <button
                                    onClick={handleLogout}
                                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                >
                                    退出登录
                                </button>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                                    {error}
                                </div>
                            )}

                            {user && (
                                <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                    <h2 className="text-xl font-semibold mb-4 text-blue-700 dark:text-blue-400">用户信息</h2>
                                    <div className="space-y-2">
                                        <p className="text-gray-700 dark:text-gray-300">
                                            <span className="font-medium">用户名：</span> {user.username}
                                        </p>
                                        <div className="flex items-center">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Webhook密钥：</span>
                                            <span className="ml-2 font-mono text-sm text-gray-600 dark:text-gray-400 truncate max-w-md">
                                                {user.webhookKey}
                                            </span>
                                            <button
                                                onClick={() => copyWebhookKey(user.webhookKey)}
                                                className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">创建卡链接</h2>

                                <div className="space-y-4">
                                    {/* 应用模板选择 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            选择应用模板 <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={selectedTemplate}
                                            onChange={(e) => setSelectedTemplate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                            disabled={loading}
                                        >
                                            <option value="">-- 请选择模板 --</option>
                                            {templates.map(template => (
                                                <option key={template.id} value={template.id}>
                                                    {template.name} - {template.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* 手机号输入 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            手机号列表 <span className="text-red-500">*</span>
                                        </label>
                                        <div className="space-y-2">
                                            {phoneNumbers.map((phone, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={phone}
                                                        onChange={(e) => updatePhoneNumber(index, e.target.value)}
                                                        className={`flex-1 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white ${phone && !isValidPhone(phone)
                                                            ? 'border-red-500 dark:border-red-500'
                                                            : 'border-gray-300 dark:border-gray-600'
                                                            }`}
                                                        placeholder="请输入手机号（11位数字，以1开头）"
                                                        disabled={loading}
                                                    />
                                                    <button
                                                        onClick={() => removePhoneInput(index)}
                                                        className="px-3 py-2 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                                                        disabled={phoneNumbers.length <= 1 || loading}
                                                    >
                                                        删除
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                        <button
                                            onClick={addPhoneInput}
                                            className="mt-2 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                            disabled={loading}
                                        >
                                            添加手机号
                                        </button>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            有效手机号数量: {phoneNumbers.filter(p => p.trim() && isValidPhone(p)).length}
                                        </p>
                                    </div>

                                    {/* 链接数量选择 */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            生成链接数量 <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={linkCount}
                                            onChange={(e) => setLinkCount(parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                            disabled={loading}
                                        >
                                            {validLinkCounts.map(count => (
                                                <option key={count} value={count}>
                                                    {count} 个链接
                                                </option>
                                            ))}
                                        </select>
                                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                            {phoneNumbers.filter(p => p.trim() && isValidPhone(p)).length > 1
                                                ? '链接数量必须是有效手机号数量的倍数'
                                                : '可以生成任意数量的链接'}
                                        </p>
                                    </div>

                                    {/* 生成按钮 */}
                                    <div>
                                        <button
                                            onClick={createCardLink}
                                            className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                                            disabled={loading}
                                        >
                                            {loading ? '创建中...' : `创建 ${linkCount} 个卡链接`}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">卡链接列表</h2>
                                {loading ? (
                                    <div className="text-center py-8">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 dark:border-gray-600 border-t-blue-600"></div>
                                        <p className="mt-2 text-gray-600 dark:text-gray-400">加载中...</p>
                                    </div>
                                ) : cardLinks.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-gray-600 dark:text-gray-400">暂无卡链接，请创建卡链接</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {cardLinks.map((cardLink) => (
                                            <div key={cardLink.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                                                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {cardLink.appName}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                        创建时间: {new Date(cardLink.createdAt).toLocaleString()}
                                                    </p>
                                                    {cardLink.firstUsedAt && (
                                                        <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                                                            首次使用: {new Date(cardLink.firstUsedAt).toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="p-4">
                                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        手机号码
                                                    </h4>
                                                    <ul className="space-y-1 mb-3">
                                                        {cardLink.phoneNumbers && Array.isArray(cardLink.phoneNumbers) && cardLink.phoneNumbers.map((phone: string, index: number) => (
                                                            <li key={index} className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                                                {phone}
                                                            </li>
                                                        ))}
                                                        {cardLink.phones && (
                                                            Array.isArray(cardLink.phones)
                                                                ? cardLink.phones.map((phone: string, index: number) => (
                                                                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                                                        {phone}
                                                                    </li>
                                                                ))
                                                                : typeof cardLink.phones === 'string' ? (
                                                                    <li className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                                                        {cardLink.phones}
                                                                    </li>
                                                                ) : null
                                                        )}
                                                    </ul>

                                                    {cardLink.url && (
                                                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    链接:
                                                                </span>
                                                                <button
                                                                    onClick={() => cardLink.url && copyCardLinkUrl(cardLink.url)}
                                                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                                >
                                                                    复制链接
                                                                </button>
                                                            </div>
                                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 break-all">
                                                                {cardLink.url}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">用户登录</h2>

                        {error && (
                            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    用户名
                                </label>
                                <input
                                    type="text"
                                    id="username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                    placeholder="输入用户名"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    密码
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                    placeholder="输入密码"
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <button
                                    onClick={handleLogin}
                                    disabled={loading}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? '登录中...' : '登录'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
} 