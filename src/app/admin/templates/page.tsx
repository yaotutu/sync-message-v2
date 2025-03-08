'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppTemplate, CreateTemplateDTO, CreateRuleDTO, RuleType, RuleMode } from '@/types';
import { getStoredAdminPassword } from '@/lib/services/auth';
import { adminApi } from '@/lib/api-client';

export default function TemplatesPage() {
    const router = useRouter();
    const [templates, setTemplates] = useState<AppTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<AppTemplate | null>(null);

    // 表单状态
    const [formData, setFormData] = useState<CreateTemplateDTO>({
        name: '',
        description: ''
    });
    const [rules, setRules] = useState<CreateRuleDTO[]>([]);

    // 文件导入相关
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadTemplates();
    }, []);

    // 获取管理员密码
    function getAdminPassword() {
        const password = getStoredAdminPassword();
        if (!password) {
            router.push('/admin');
            return null;
        }
        return password;
    }

    // 加载模板列表
    const loadTemplates = async () => {
        setLoading(true);
        setError('');

        const password = getAdminPassword();
        if (!password) return;

        try {
            const data = await adminApi.get('/api/admin/templates');

            if (data.success) {
                setTemplates(data.data || []);
            } else {
                setError(data.message || '加载模板失败');
            }
        } catch (err) {
            console.error('加载模板错误:', err);
            setError('加载模板失败，请检查网络连接');
        } finally {
            setLoading(false);
        }
    };

    // 保存模板
    const saveTemplate = async () => {
        const password = getAdminPassword();
        if (!password) return;

        if (!formData.name.trim()) {
            setError('应用名称不能为空');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 检查是否存在同名模板（排除当前正在编辑的模板）
            const existingTemplatesResponse = await adminApi.get('/api/admin/templates');
            const existingTemplates = existingTemplatesResponse.success ? existingTemplatesResponse.data : [];
            const existingTemplate = existingTemplates.find(
                (t: AppTemplate) => t.name === formData.name && (!isEditing || t.id !== currentTemplate?.id)
            );

            if (existingTemplate) {
                setError('已存在同名模板，请使用其他名称');
                setLoading(false);
                return;
            }

            let url = '/api/admin/templates';
            let method = 'POST';
            let body: any = { ...formData };

            if (isEditing && currentTemplate) {
                url = `/api/admin/templates/${currentTemplate.id}`;
                method = 'PATCH';
                body.rules = rules;
            }

            const data = method === 'POST'
                ? await adminApi.post(url, body)
                : await adminApi.patch(url, body);

            if (data.success) {
                // 如果是创建新模板，并且有规则需要添加
                if (!isEditing && rules.length > 0 && data.data?.id) {
                    // 逐个添加规则
                    for (const rule of rules) {
                        await adminApi.post(`/api/admin/templates/${data.data.id}/rules`, rule);
                    }
                }

                closeForm();
                loadTemplates();
            } else {
                setError(data.message || '保存模板失败');
            }
        } catch (err) {
            console.error('保存模板错误:', err);
            setError('保存模板失败，请检查网络连接');
        } finally {
            setLoading(false);
        }
    };

    // 删除模板
    const deleteTemplate = async (templateId: string) => {
        if (!confirm('确定要删除此模板吗？此操作不可恢复。')) {
            return;
        }

        const password = getAdminPassword();
        if (!password) return;

        setLoading(true);
        setError('');

        try {
            const data = await adminApi.delete(`/api/admin/templates/${templateId}`);

            if (data.success) {
                loadTemplates();
            } else {
                setError(data.message || '删除模板失败');
            }
        } catch (err) {
            console.error('删除模板错误:', err);
            setError('删除模板失败，请检查网络连接');
        } finally {
            setLoading(false);
        }
    };

    // 添加规则输入
    const addRuleInput = () => {
        setRules([
            ...rules,
            { type: 'include', mode: 'simple_include', pattern: '', description: '' }
        ]);
    };

    // 移除规则输入
    const removeRuleInput = (index: number) => {
        setRules(rules.filter((_, i) => i !== index));
    };

    // 更新规则
    const updateRule = (index: number, field: keyof CreateRuleDTO, value: string) => {
        const updatedRules = [...rules];
        updatedRules[index] = {
            ...updatedRules[index],
            [field]: value
        };
        setRules(updatedRules);
    };

    // 更新规则类型和模式
    const updateRuleTypeAndMode = (index: number, value: string) => {
        const updatedRules = [...rules];
        if (value === 'regex') {
            updatedRules[index] = {
                ...updatedRules[index],
                type: 'include',
                mode: 'regex'
            };
        } else {
            const [type, mode] = value.split('_');
            updatedRules[index] = {
                ...updatedRules[index],
                type: type as RuleType,
                mode: `simple_${type}` as RuleMode
            };
        }
        setRules(updatedRules);
    };

    // 开始编辑模板
    const startEditing = (template: AppTemplate) => {
        setCurrentTemplate(template);
        setFormData({
            name: template.name,
            description: template.description
        });

        // 转换规则格式，确保 mode 值正确
        const templateRules = template.rules.map(rule => {
            let mode: RuleMode;
            if (rule.mode === 'regex') {
                mode = 'regex';
            } else {
                mode = `simple_${rule.type}` as RuleMode;
            }

            return {
                type: rule.type,
                mode: mode,
                pattern: rule.pattern,
                description: rule.description
            };
        });

        setRules(templateRules);
        setIsEditing(true);
        setIsFormOpen(true);
    };

    // 开始创建新模板
    const startCreating = () => {
        setCurrentTemplate(null);
        setFormData({
            name: '',
            description: ''
        });
        setRules([]);
        setIsEditing(false);
        setIsFormOpen(true);
    };

    // 关闭表单
    const closeForm = () => {
        setIsFormOpen(false);
        setCurrentTemplate(null);
        setFormData({
            name: '',
            description: ''
        });
        setRules([]);
        setIsEditing(false);
        setError('');
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
            <div className="max-w-6xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">模板管理</h1>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => router.push('/admin')}
                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                            >
                                返回
                            </button>
                            <button
                                onClick={startCreating}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                disabled={loading}
                            >
                                创建模板
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded">
                            {error}
                        </div>
                    )}

                    {loading && !isFormOpen ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 dark:border-gray-600 border-t-blue-600"></div>
                            <p className="mt-2 text-gray-600 dark:text-gray-400">加载中...</p>
                        </div>
                    ) : (
                        <>
                            {isFormOpen ? (
                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                                        {isEditing ? '编辑模板' : '创建模板'}
                                    </h2>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                应用名称 <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                                placeholder="输入应用名称"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                应用描述
                                            </label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                                placeholder="输入应用描述"
                                                rows={3}
                                            />
                                        </div>

                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                    规则列表
                                                </label>
                                                <button
                                                    type="button"
                                                    onClick={addRuleInput}
                                                    className="text-sm px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                                >
                                                    添加规则
                                                </button>
                                            </div>

                                            {rules.length === 0 ? (
                                                <div className="text-sm text-gray-500 dark:text-gray-400 italic">
                                                    暂无规则，点击"添加规则"按钮添加
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {rules.map((rule, index) => (
                                                        <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800">
                                                            <div className="flex justify-between mb-2">
                                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                                    规则 #{index + 1}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeRuleInput(index)}
                                                                    className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                                                >
                                                                    删除
                                                                </button>
                                                            </div>
                                                            <div className="grid grid-cols-1 gap-3">
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                        规则类型
                                                                    </label>
                                                                    <select
                                                                        value={rule.mode === 'regex' ? 'regex' : rule.type}
                                                                        onChange={(e) => updateRuleTypeAndMode(index, e.target.value)}
                                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                                                    >
                                                                        <option value="include">包含文本</option>
                                                                        <option value="exclude">排除文本</option>
                                                                        <option value="regex">正则表达式</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                        匹配内容 <span className="text-red-500">*</span>
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={rule.pattern}
                                                                        onChange={(e) => updateRule(index, 'pattern', e.target.value)}
                                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                                                        placeholder={rule.mode === 'regex' ? '输入正则表达式' : '输入匹配文本'}
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                        规则描述
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={rule.description}
                                                                        onChange={(e) => updateRule(index, 'description', e.target.value)}
                                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                                                        placeholder="输入规则描述"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-end space-x-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={closeForm}
                                                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                            >
                                                取消
                                            </button>
                                            <button
                                                type="button"
                                                onClick={saveTemplate}
                                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                                disabled={loading}
                                            >
                                                {loading ? '保存中...' : '保存'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {templates.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-gray-600 dark:text-gray-400">暂无模板，点击"创建模板"按钮添加</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {templates.map((template) => (
                                                <div key={template.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
                                                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                                                        <div className="flex justify-between items-start">
                                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                                                {template.name}
                                                            </h3>
                                                            <div className="flex space-x-1">
                                                                <button
                                                                    onClick={() => startEditing(template)}
                                                                    className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => deleteTemplate(template.id)}
                                                                    className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                            {template.description || '无描述'}
                                                        </p>
                                                    </div>
                                                    <div className="p-4">
                                                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            规则 ({template.rules.length})
                                                        </h4>
                                                        {template.rules.length === 0 ? (
                                                            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                                                暂无规则
                                                            </p>
                                                        ) : (
                                                            <ul className="space-y-2 max-h-40 overflow-y-auto">
                                                                {template.rules.map((rule) => (
                                                                    <li key={rule.id} className="text-sm p-2 bg-gray-50 dark:bg-gray-700 rounded">
                                                                        <div className="flex items-center space-x-2">
                                                                            <span className={`inline-block w-2 h-2 rounded-full ${rule.type === 'include' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                                            <span className="font-medium">
                                                                                {rule.type === 'include' ? '包含' : '排除'}:
                                                                            </span>
                                                                            <span className="truncate flex-1">
                                                                                {rule.pattern}
                                                                            </span>
                                                                        </div>
                                                                        {rule.description && (
                                                                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                                                                {rule.description}
                                                                            </p>
                                                                        )}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
} 