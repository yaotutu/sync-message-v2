import { NextRequest } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * 验证管理员密码
 * @param password 管理员密码
 * @returns 验证结果
 */
export function validateAdminPassword(password: string): boolean {
    return password === ADMIN_PASSWORD;
}

/**
 * 从请求头中获取管理员密码
 * @param req 请求对象
 * @returns 管理员密码
 */
export function getAdminPasswordFromHeader(req: NextRequest): string | null {
    return req.headers.get('x-admin-password');
}

/**
 * 验证管理员权限
 * @param req 请求对象
 * @returns 验证结果
 */
export function verifyAdminAuth(req: NextRequest): { success: boolean; message?: string } {
    const adminPassword = getAdminPasswordFromHeader(req);

    if (!adminPassword) {
        return { success: false, message: '缺少管理员密码' };
    }

    if (!validateAdminPassword(adminPassword)) {
        return { success: false, message: '管理员密码验证失败' };
    }

    return { success: true };
}

/**
 * 获取本地存储的管理员密码
 * @returns 管理员密码
 */
export function getStoredAdminPassword(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const stored = localStorage.getItem('admin_auth');
        if (!stored) return null;
        const data = JSON.parse(stored);
        return data.password || null;
    } catch (e) {
        console.error('获取存储的管理员密码失败:', e);
        return null;
    }
}

/**
 * 设置本地存储的管理员密码
 * @param password 管理员密码
 */
export function setStoredAdminPassword(password: string): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        localStorage.setItem('admin_auth', JSON.stringify({ password }));
    } catch (e) {
        console.error('存储管理员密码失败:', e);
    }
}

/**
 * 清除本地存储的管理员密码
 */
export function clearStoredAdminPassword(): void {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        localStorage.removeItem('admin_auth');
    } catch (e) {
        console.error('清除存储的管理员密码失败:', e);
    }
} 