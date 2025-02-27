'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface AdminAuthContextType {
    isLoggedIn: boolean;
    password: string;
    login: (password: string) => Promise<boolean>;
    error: string;
    isLoading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function useAdminAuth() {
    const context = useContext(AdminAuthContext);
    if (!context) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider');
    }
    return context;
}

interface AdminAuthProviderProps {
    children: ReactNode;
}

export function AdminAuthProvider({ children }: AdminAuthProviderProps) {
    const [password, setPassword] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const login = async (inputPassword: string) => {
        if (!inputPassword.trim()) {
            setError('请输入管理员密码');
            return false;
        }

        setIsLoading(true);
        setError('');
        try {
            const response = await fetch('/api/manage/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: inputPassword.trim() }),
            });

            const data = await response.json();
            if (data.success) {
                setPassword(inputPassword.trim());
                setIsLoggedIn(true);
                setError('');
                return true;
            } else {
                setError(data.message || '管理员密码错误');
                return false;
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('网络错误，请检查网络连接后重试');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AdminAuthContext.Provider value={{ isLoggedIn, password, login, error, isLoading }}>
            {children}
        </AdminAuthContext.Provider>
    );
}

// 简单的本地存储管理
const AUTH_KEY = 'admin_auth';

function getStoredAuth() {
    try {
        const stored = localStorage.getItem(AUTH_KEY);
        if (!stored) return null;
        return JSON.parse(stored);
    } catch (e) {
        return null;
    }
}

function setStoredAuth(password: string) {
    try {
        localStorage.setItem(AUTH_KEY, JSON.stringify({ password }));
    } catch (e) {
        console.error('Failed to store auth:', e);
    }
}

function clearStoredAuth() {
    try {
        localStorage.removeItem(AUTH_KEY);
    } catch (e) {
        console.error('Failed to clear auth:', e);
    }
}

interface AdminLoginProps {
    children: ReactNode;
    showLogout?: boolean;
}

export function AdminLogin({ children, showLogout = true }: AdminLoginProps) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    // 在组件挂载后检查登录状态
    useEffect(() => {
        setMounted(true);
        const auth = getStoredAuth();
        if (auth?.password) {
            setIsLoggedIn(true);
        }
    }, []);

    const login = async () => {
        if (!password.trim()) {
            setError('请输入管理员密码');
            return;
        }

        setIsLoading(true);
        setError('');
        try {
            const response = await fetch('/api/manage/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: password.trim() }),
            });

            const data = await response.json();
            if (data.success) {
                setStoredAuth(password.trim());
                setIsLoggedIn(true);
                setError('');
            } else {
                setError(data.message || '管理员密码错误');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('网络错误，请检查网络连接后重试');
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        clearStoredAuth();
        setIsLoggedIn(false);
        setPassword('');
        // 刷新页面以清除所有状态
        window.location.href = '/manage';
    };

    // 在组件挂载前不渲染任何内容
    if (!mounted) {
        return null;
    }

    // 如果已登录，直接渲染子组件
    if (isLoggedIn) {
        return (
            <>
                {showLogout && (
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={logout}
                            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                            退出登录
                        </button>
                    </div>
                )}
                {children}
            </>
        );
    }

    // 否则显示登录界面
    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">管理员登录</h2>
            <div className="space-y-4">
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && login()}
                    placeholder="请输入管理员密码"
                    className="w-full px-4 py-2 border dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all disabled:bg-gray-100 dark:bg-gray-700 dark:text-white dark:disabled:bg-gray-600"
                    disabled={isLoading}
                />
                <button
                    onClick={login}
                    disabled={isLoading}
                    className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:bg-blue-300 dark:disabled:bg-blue-400 transition-all"
                >
                    {isLoading ? '登录中...' : '登录'}
                </button>
                {error && (
                    <div className="text-red-500 dark:text-red-400 text-sm mt-2">{error}</div>
                )}
            </div>
        </div>
    );
} 