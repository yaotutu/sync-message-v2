'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AdminLogin } from '../components/AdminAuth';
import { AppTemplate, ApiResponse, CreateTemplateDTO, TemplateRule, CreateRuleDTO, RuleType, RuleMode } from '@/types/templates';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<AppTemplate[]>([]);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<AppTemplate | null>(null);

    // 新建模板的状态
    const [isCreating, setIsCreating] = useState(false);
    const [newTemplate, setNewTemplate] = useState<CreateTemplateDTO>({
        name: '',
        description: ''
    });

    // 新建规则的状态
    const [isAddingRule, setIsAddingRule] = useState(false);
    const [newRule, setNewRule] = useState<CreateRuleDTO>({
        type: 'include',
        mode: 'simple',
        pattern: '',
        description: ''
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

    // 创建新模板
    const createTemplate = async () => {
        if (!newTemplate.name.trim()) {
            setError('请输入应用名称');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const response = await fetch('/api/manage/templates', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-password': getAdminPassword(),
                },
                body: JSON.stringify(newTemplate),
            });

            const data = await response.json();
            if (data.success) {
                await loadTemplates();
                setIsCreating(false);
                setNewTemplate({ name: '', description: '' });
            } else {
                setError(data.message || '创建应用模板失败');
            }
        } catch (error) {
            console.error('Create template error:', error);
            setError('网络错误，请检查网络连接后重试');
        } finally {
            setIsLoading(false);
        }
    };

    // 添加新规则
    const addRule = async () => {
        if (!selectedTemplate) return;
        if (!newRule.pattern.trim()) {
            setError('请输入规则表达式');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/manage/templates/${selectedTemplate.id}/rules`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-password': getAdminPassword(),
                },
                body: JSON.stringify(newRule),
            });

            const data = await response.json();
            if (data.success) {
                await loadTemplates();
                setIsAddingRule(false);
                setNewRule({ type: 'include', mode: 'simple', pattern: '', description: '' });
            } else {
                setError(data.message || '添加规则失败');
            }
        } catch (error) {
            console.error('Add rule error:', error);
            setError('网络错误，请检查网络连接后重试');
        } finally {
            setIsLoading(false);
        }
    };

    // 删除规则
    const deleteRule = async (templateId: string, ruleId: string) => {
        if (!confirm('确定要删除这条规则吗？')) return;

        setIsLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/manage/templates/${templateId}/rules/${ruleId}`, {
                method: 'DELETE',
                headers: {
                    'x-admin-password': getAdminPassword(),
                },
            });

            const data = await response.json();
            if (data.success) {
                await loadTemplates();
            } else {
                setError(data.message || '删除规则失败');
            }
        } catch (error) {
            console.error('Delete rule error:', error);
            setError('网络错误，请检查网络连接后重试');
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
                setSelectedTemplate(null);
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
                                    {!isCreating && (
                                        <button
                                            onClick={() => setIsCreating(true)}
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

                            {/* 新建模板表单 */}
                            {isCreating && (
                                <div className="mb-6 p-4 border border-blue-100 dark:border-blue-900 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">新建应用模板</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                应用名称
                                            </label>
                                            <input
                                                type="text"
                                                value={newTemplate.name}
                                                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                                                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:text-white"
                                                placeholder="输入应用名称"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                应用描述
                                            </label>
                                            <input
                                                type="text"
                                                value={newTemplate.description}
                                                onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                                                className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:text-white"
                                                placeholder="输入应用描述"
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={() => {
                                                    setIsCreating(false);
                                                    setNewTemplate({ name: '', description: '' });
                                                }}
                                                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                            >
                                                取消
                                            </button>
                                            <button
                                                onClick={createTemplate}
                                                disabled={isLoading}
                                                className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:bg-blue-300 dark:disabled:bg-blue-400 transition-all"
                                            >
                                                {isLoading ? '创建中...' : '创建'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 模板列表 */}
                            <div className="space-y-4">
                                {templates.map((template) => (
                                    <div
                                        key={template.id}
                                        className={`border dark:border-gray-700 rounded-lg transition-colors ${selectedTemplate?.id === template.id
                                            ? 'border-blue-500 dark:border-blue-400'
                                            : 'hover:border-gray-300 dark:hover:border-gray-600'
                                            }`}
                                    >
                                        {/* 模板头部 */}
                                        <div
                                            className="p-4 cursor-pointer"
                                            onClick={() => setSelectedTemplate(selectedTemplate?.id === template.id ? null : template)}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                        {template.name}
                                                    </h3>
                                                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                                                        {template.description}
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <div className="text-sm text-gray-400 dark:text-gray-500">
                                                        规则数量: {template.rules.length}
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteTemplate(template.id);
                                                        }}
                                                        className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                                    >
                                                        删除
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 模板详情 */}
                                        {selectedTemplate?.id === template.id && (
                                            <div className="border-t dark:border-gray-700 p-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="text-md font-medium text-gray-900 dark:text-white">规则列表</h4>
                                                    <button
                                                        onClick={() => setIsAddingRule(true)}
                                                        className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300"
                                                    >
                                                        添加规则
                                                    </button>
                                                </div>

                                                {/* 添加规则表单 */}
                                                {isAddingRule && (
                                                    <div className="mb-4 p-4 border border-blue-100 dark:border-blue-900 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                                                        <div className="space-y-4">
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                    规则类型
                                                                </label>
                                                                <select
                                                                    value={newRule.type}
                                                                    onChange={(e) => setNewRule({ ...newRule, type: e.target.value as RuleType })}
                                                                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:text-white"
                                                                >
                                                                    <option value="include">包含</option>
                                                                    <option value="exclude">排除</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                    规则模式
                                                                </label>
                                                                <select
                                                                    value={newRule.mode}
                                                                    onChange={(e) => setNewRule({ ...newRule, mode: e.target.value as RuleMode })}
                                                                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:text-white"
                                                                >
                                                                    <option value="simple">简单文本</option>
                                                                    <option value="regex">正则表达式</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                    {newRule.mode === 'simple' ? '匹配文本' : '正则表达式'}
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={newRule.pattern}
                                                                    onChange={(e) => setNewRule({ ...newRule, pattern: e.target.value })}
                                                                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:text-white"
                                                                    placeholder={newRule.mode === 'simple' ? '输入要匹配的文本' : '输入正则表达式'}
                                                                />
                                                                {newRule.mode === 'simple' && (
                                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                                        直接输入要匹配的文本，无需考虑特殊字符
                                                                    </p>
                                                                )}
                                                                {newRule.mode === 'regex' && (
                                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                                        使用正则表达式进行高级匹配，如：^验证码.*$
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                    规则描述
                                                                </label>
                                                                <input
                                                                    type="text"
                                                                    value={newRule.description}
                                                                    onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                                                                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all dark:bg-gray-700 dark:text-white"
                                                                    placeholder="输入规则描述"
                                                                />
                                                            </div>
                                                            <div className="flex justify-end space-x-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setIsAddingRule(false);
                                                                        setNewRule({ type: 'include', mode: 'simple', pattern: '', description: '' });
                                                                    }}
                                                                    className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                                                >
                                                                    取消
                                                                </button>
                                                                <button
                                                                    onClick={addRule}
                                                                    disabled={isLoading}
                                                                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:bg-blue-300 dark:disabled:bg-blue-400 transition-all"
                                                                >
                                                                    {isLoading ? '添加中...' : '添加'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 规则列表 */}
                                                <div className="space-y-2">
                                                    {template.rules.map((rule) => (
                                                        <div
                                                            key={rule.id}
                                                            className="flex items-center justify-between p-2 border dark:border-gray-700 rounded-lg"
                                                        >
                                                            <div>
                                                                <div className="flex items-center space-x-2">
                                                                    <span className={`text-sm font-medium ${rule.type === 'include'
                                                                        ? 'text-green-500 dark:text-green-400'
                                                                        : 'text-red-500 dark:text-red-400'
                                                                        }`}>
                                                                        {rule.type === 'include' ? '包含' : '排除'}
                                                                    </span>
                                                                    <span className="text-gray-400 dark:text-gray-500">|</span>
                                                                    <span className={`text-sm ${rule.mode === 'simple'
                                                                        ? 'text-blue-500 dark:text-blue-400'
                                                                        : 'text-purple-500 dark:text-purple-400'
                                                                        }`}>
                                                                        {rule.mode === 'simple' ? '文本' : '正则'}
                                                                    </span>
                                                                    <span className="text-gray-400 dark:text-gray-500">|</span>
                                                                    <span className="text-sm text-gray-900 dark:text-white font-mono">
                                                                        {rule.pattern}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                                    {rule.description}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => deleteRule(template.id, rule.id)}
                                                                className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                                                            >
                                                                删除
                                                            </button>
                                                        </div>
                                                    ))}

                                                    {template.rules.length === 0 && (
                                                        <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                                                            暂无规则，点击"添加规则"按钮创建第一条规则
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {templates.length === 0 && !isLoading && !isCreating && (
                                    <div className="text-center py-12">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">暂无应用模板</h3>
                                        <p className="text-gray-500 dark:text-gray-400">
                                            点击"新建应用模板"按钮创建第一个应用模板
                                        </p>
                                    </div>
                                )}

                                {isLoading && !isCreating && (
                                    <div className="text-center py-12">
                                        <div className="inline-flex items-center justify-center">
                                            <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </AdminLogin>
            </div>
        </div>
    );
} 