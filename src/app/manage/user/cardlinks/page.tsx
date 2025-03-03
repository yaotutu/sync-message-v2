'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function CardLinksPage() {
    const [username, setUsername] = useState('');
    const [appName, setAppName] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const adminPassword = localStorage.getItem('admin_auth') ? JSON.parse(localStorage.getItem('admin_auth')!).password : '';

    const fetchCardLinks = async () => {
        // 实现获取卡密链接列表的逻辑
        // ...
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 输入验证
        if (!username.trim()) {
            toast.error('用户名不能为空');
            return;
        }

        // 如果填写了手机号，验证格式
        if (phone.trim() && !/^1[3-9]\d{9}$/.test(phone.trim())) {
            toast.error('手机号格式不正确');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch('/api/cardlinks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-password': adminPassword
                },
                body: JSON.stringify({
                    username: username.trim(),
                    appName: appName.trim() || null,
                    phone: phone.trim() || null
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || '创建失败');
            }

            if (data.success) {
                setUsername('');
                setAppName('');
                setPhone('');
                fetchCardLinks();
                toast.success('创建成功');
            }
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : '创建失败');
        } finally {
            setIsLoading(false);
        }
    };

    // 渲染表单的JSX
    return (
    // ... 你的表单JSX
  );
} 