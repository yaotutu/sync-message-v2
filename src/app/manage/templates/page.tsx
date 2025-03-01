'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminLogin } from '../components/AdminAuth';
import { AppTemplate, ApiResponse, CreateTemplateDTO, TemplateRule, CreateRuleDTO, RuleType, RuleMode } from '@/types/templates';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<AppTemplate[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // 统一的表单状态
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<CreateTemplateDTO & { rules: CreateRuleDTO[] }>({
        name: '',
        description: '',
        rules: [{ type: 'include', mode: 'simple_include', pattern: '', description: '' }]
    });

    // 获取管理员密码
    function getAdminPassword() {
        try {
            const stored = localStorage.getItem('admin_auth');
            if (!stored) return '';
            const data = JSON.parse(stored);
            return data.password || '';
        } catch (e) {
            return '';
        }
    }

    // 加载模板列表
    const loadTemplates = async () => {
        setIsLoading(true);
        setError('');
        try {
            const response = await fetch('/api/manage/templates', {
                headers: {
                    'x-admin-password': getAdminPassword(),
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ApiResponse<AppTemplate[]> = await response.json();
            if (data.success && Array.isArray(data.data)) {
                setTemplates(data.data);
            } else {
                setError(data.message || '加载应用模板列表失败');
                setTemplates([]);
            }
        } catch (error) {
            console.error('Load templates error:', error);
            setError('网络错误，请检查网络连接后重试');
            setTemplates([]);
        } finally {
            setIsLoading(false);
        }
    };

    // 保存模板(创建或更新)
    const saveTemplate = async () => {
        if (!formData.name.trim()) {
            setError('请输入应用名称');
            return;
        }

        if (formData.rules.length === 0) {
            setError('请至少添加一条规则');
            return;
        }

        if (formData.rules.some(rule => !rule.pattern.trim())) {
            setError('规则表达式不能为空');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const isEditing = !!editingId;
            const url = isEditing ? `/api/manage/templates/${editingId}` : '/api/manage/templates';
            const method = isEditing ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-password': getAdminPassword(),
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (!data.success) {
                throw new Error(data.message || `${isEditing ? '更新' : '创建'}应用模板失败`);
            }

            await loadTemplates();
            closeForm();
        } catch (error) {
            console.error('Save template error:', error);
            setError(error instanceof Error ? error.message : '保存失败，请稍后重试');
        } finally {
            setIsLoading(false);
        }
    };

    // 删除模板
    const deleteTemplate = async (templateId: string) => {
        if (!confirm('确定要删除这个应用模板吗？此操作将删除所有相关规则。')) return;

        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/manage/templates/${templateId}`, {
                method: 'DELETE',
                headers: {
                    'x-admin-password': getAdminPassword(),
                },
            });

            const data = await response.json();
            if (data.success) {
                await loadTemplates();
            } else {
                setError(data.message || '删除应用模板失败');
            }
        } catch (error) {
            console.error('Delete template error:', error);
            setError('网络错误，请检查网络连接后重试');
        } finally {
            setIsLoading(false);
        }
    };

    // 添加规则输入框
    const addRuleInput = () => {
        setFormData(prev => ({
            ...prev,
            rules: [...prev.rules, { type: 'include', mode: 'simple_include', pattern: '', description: '' }]
        }));
    };

    // 删除规则输入框
    const removeRuleInput = (index: number) => {
        if (formData.rules.length === 1) {
            setError('至少需要保留一条规则');
            return;
        }
        setFormData(prev => ({
            ...prev,
            rules: prev.rules.filter((_, i) => i !== index)
        }));
    };

    // 更新规则输入
    const updateRule = (index: number, field: keyof CreateRuleDTO, value: string) => {
        setFormData(prev => ({
            ...prev,
            rules: prev.rules.map((rule, i) =>
                i === index ? { ...rule, [field]: value } : rule
            )
        }));
    };

    // 开始编辑模板
    const startEditing = (template: AppTemplate) => {
        setEditingId(template.id);
        setFormData({
            name: template.name,
            description: template.description,
            rules: template.rules.map(rule => ({
                type: rule.type,
                mode: rule.mode,
                pattern: rule.pattern,
                description: rule.description
            }))
        });
        setIsFormOpen(true);
    };

    // 开始创建模板
    const startCreating = () => {
        setEditingId(null);
        setFormData({
            name: '',
            description: '',
            rules: [{ type: 'include', mode: 'simple_include', pattern: '', description: '' }]
        });
        setIsFormOpen(true);
    };

    // 关闭表单
    const closeForm = () => {
        setIsFormOpen(false);
        setEditingId(null);
        setFormData({
            name: '',
            description: '',
            rules: [{ type: 'include', mode: 'simple_include', pattern: '', description: '' }]
        });
        setError('');
    };

    // 在组件挂载后加载数据
    useEffect(() => {
        const adminPassword = getAdminPassword();
        if (adminPassword) {
            loadTemplates();
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <AdminLogin showLogout={false}>
                    <div className="space-y-6">
                        {/* 头部 */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">应用模板管理</h2>
                                <div className="flex items-center space-x-4">
                                    <Link
                                        href="/manage"
                                        className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                    >
                                        返回管理后台
                                    </Link>
                                    {!isFormOpen && (
                                        <button
                                            onClick={startCreating}
                                            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all"
                                        >
                                            新建应用模板
                                        </button>
                                    )}
                                </div>
                            </div>

                            {error && (
                                <div className="text-red-500 dark:text-red-400 text-sm mb-4">{error}</div>
                            )}

                            {/* 模板表单 */}
                            {isFormOpen && (
                                <div className="mb-6 p-4 border border-blue-100 dark:border-blue-900 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        {editingId ? '编辑应用模板' : '新建应用模板'}
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                应用名称
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                                placeholder="输入应用名称"
                                                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-600"
                                                disabled={isLoading}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                应用描述
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.description}
                                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                                placeholder="输入应用描述"
                                                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-600"
                                                disabled={isLoading}
                                            />
                                        </div>

                                        {/* 规则列表 */}
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    规则列表
                                                </label>
                                                <button
                                                    onClick={addRuleInput}
                                                    className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                                >
                                                    添加规则
                                                </button>
                                            </div>
                                            {formData.rules.map((rule, index) => (
                                                <div key={index} className="p-4 border dark:border-gray-700 rounded-lg space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                            规则 {index + 1}
                                                        </span>
                                                        {formData.rules.length > 1 && (
                                                            <button
                                                                onClick={() => removeRuleInput(index)}
                                                                className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                                            >
                                                                删除
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 gap-3">
                                                        <div>
                                                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                                规则模式
                                                            </label>
                                                            <select
                                                                value={rule.mode}
                                                                onChange={(e) => {
                                                                    const mode = e.target.value as RuleMode;
                                                                    updateRule(index, 'mode', mode);
                                                                    // 根据模式自动设置类型
                                                                    updateRule(index, 'type',
                                                                        mode === 'simple_include' ? 'include' :
                                                                            mode === 'simple_exclude' ? 'exclude' :
                                                                                rule.type
                                                                    );
                                                                }}
                                                                className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:text-white"
                                                            >
                                                                <option value="simple_include">包含文本</option>
                                                                <option value="simple_exclude">不包含文本</option>
                                                                <option value="regex">正则表达式</option>
                                                            </select>
                                                        </div>
                                                        {rule.mode === 'regex' && (
                                                            <div>
                                                                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                                    规则类型
                                                                </label>
                                                                <select
                                                                    value={rule.type}
                                                                    onChange={(e) => updateRule(index, 'type', e.target.value as RuleType)}
                                                                    className="w-full px-3 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:text-white"
                                                                >
                                                                    <option value="include">包含匹配</option>
                                                                    <option value="exclude">排除匹配</option>
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                            {rule.mode === 'regex' ? '正则表达式' : '匹配文本'}
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={rule.pattern}
                                                            onChange={(e) => updateRule(index, 'pattern', e.target.value)}
                                                            placeholder={rule.mode === 'regex' ? '输入正则表达式' : '输入要匹配的文本'}
                                                            className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                            规则描述
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={rule.description}
                                                            onChange={(e) => updateRule(index, 'description', e.target.value)}
                                                            placeholder="输入规则描述"
                                                            className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:text-white"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-end space-x-3 mt-4">
                                            <button
                                                onClick={closeForm}
                                                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                                disabled={isLoading}
                                            >
                                                取消
                                            </button>
                                            <button
                                                onClick={saveTemplate}
                                                disabled={isLoading}
                                                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:bg-blue-300 dark:disabled:bg-blue-400 transition-all"
                                            >
                                                {isLoading ? '保存中...' : (editingId ? '更新模板' : '创建模板')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 模板列表 */}
                            {!isFormOpen && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow divide-y dark:divide-gray-700">
                                    {templates.map((template) => (
                                        <div key={template.id} className="p-6 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                        {template.name}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                        {template.description}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <button
                                                        onClick={() => startEditing(template)}
                                                        className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        编辑
                                                    </button>
                                                    <button
                                                        onClick={() => deleteTemplate(template.id)}
                                                        className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        删除
                                                    </button>
                                                </div>
                                            </div>

                                            {/* 规则列表 */}
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">规则列表</h4>
                                                <div className="space-y-2">
                                                    {template.rules.map((rule) => (
                                                        <div
                                                            key={rule.id}
                                                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                                                        >
                                                            <div className="space-y-1">
                                                                <div className="flex items-center space-x-2">
                                                                    <span className={`text-sm font-medium ${rule.mode === 'simple_include' || (rule.mode === 'regex' && rule.type === 'include')
                                                                        ? 'text-green-600 dark:text-green-400'
                                                                        : 'text-red-600 dark:text-red-400'
                                                                        }`}>
                                                                        {rule.mode === 'regex'
                                                                            ? (rule.type === 'include' ? '正则包含' : '正则排除')
                                                                            : (rule.mode === 'simple_include' ? '包含文本' : '不包含文本')}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm font-mono text-gray-900 dark:text-white">
                                                                    {rule.pattern}
                                                                </p>
                                                                {rule.description && (
                                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                        {rule.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {template.rules.length === 0 && (
                                                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                                            暂无规则
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {templates.length === 0 && !isLoading && (
                                        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                                            暂无应用模板
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </AdminLogin>
            </div>
        </div>
    );
} 