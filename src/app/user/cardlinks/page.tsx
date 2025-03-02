'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppTemplate, CardLink } from '@/types';
import { userApi } from '@/lib/api-client';

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
    const [linkCount, setLinkCount] = useState(1);
    const [validLinkCounts, setValidLinkCounts] = useState<number[]>([1]);

    // 检查登录状态
    useEffect(() => {
        const storedAuth = localStorage.getItem('user_auth');
        if (storedAuth) {
            try {
                const auth = JSON.parse(storedAuth);
                setUsername(auth.username);
                setPassword(auth.password);
                loadTemplates();
                loadCardLinks();
            } catch (e) {
                console.error('Failed to parse auth:', e);
                router.push('/user/login');
            }
        } else {
            router.push('/user/login');
        }
    }, []);

    // 根据手机号数量计算有效的链接数量
    useEffect(() => {
        const validPhones = phones.filter(phone => phone.trim() && isValidPhone(phone));
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
    }, [phones, linkCount]);

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
    const loadCardLinks = async () => {
        try {
            const data = await userApi.get('/api/user/cardlinks', { username, password });
            if (data.success) {
                setCardLinks(data.data || []);
            } else {
                setError(data.message || '加载卡密链接失败');
            }
        } catch (error) {
            console.error('Load card links error:', error);
            setError('加载卡密链接失败，请检查网络连接');
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

        // 验证手机号
        const validPhones = phones.filter(phone => phone.trim() && isValidPhone(phone));
        if (validPhones.length === 0) {
            setError('请至少输入一个有效的手机号码（11位数字，以1开头）');
            return;
        }

        // 检查链接数量是否是手机号数量的倍数
        if (linkCount % validPhones.length !== 0 && validPhones.length > 1) {
            setError(`链接数量必须是手机号数量(${validPhones.length})的倍数`);
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
                // 计算这个链接应该使用的手机号
                // 如果只有一个手机号，所有链接都使用这个手机号
                // 如果有多个手机号，则按顺序分配，确保所有手机号都被使用
                const phoneToUse = validPhones.length === 1
                    ? validPhones
                    : [validPhones[i % validPhones.length]];

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
                // 重置表单
                setSelectedTemplate('');
                setPhones(['']);
                setLinkCount(1);

                // 重新加载卡链接列表
                await loadCardLinks();
            }
        } catch (error) {
            console.error('Generate card link error:', error);
            setError('生成卡密链接失败，请检查网络连接');
        } finally {
            setIsLoading(false);
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
                                    手机号列表 <span className="text-red-500">*</span>
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
                                <select
                                    value={linkCount}
                                    onChange={(e) => setLinkCount(parseInt(e.target.value))}
                                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    disabled={isLoading}
                                >
                                    {validLinkCounts.map(count => (
                                        <option key={count} value={count}>
                                            {count} 个链接
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                    {phones.filter(p => p.trim() && isValidPhone(p)).length > 1
                                        ? '链接数量必须是有效手机号数量的倍数'
                                        : '可以生成任意数量的链接'}
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
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 卡密链接列表 */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                        <div className="p-6 border-b dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                已生成的卡密链接
                            </h3>
                        </div>
                        <div className="divide-y dark:divide-gray-700">
                            {cardLinks.map((cardLink) => (
                                <div key={cardLink.key} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                应用：{cardLink.appName}
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
                                            {cardLink.firstUsedAt && (
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
                                        <button
                                            onClick={() => navigator.clipboard.writeText(cardLink.url)}
                                            className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            复制链接
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {cardLinks.length === 0 && (
                                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                    暂无卡密链接
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 