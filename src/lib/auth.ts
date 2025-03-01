import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// 验证管理员密码
export async function validateAdminPassword(req: NextRequest) {
    const adminPassword = req.headers.get('x-admin-password');

    if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
        return NextResponse.json(
            { success: false, message: '管理员密码验证失败' },
            { status: 401 }
        );
    }

    return null; // 验证通过
} 