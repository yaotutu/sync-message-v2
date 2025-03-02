import { NextRequest, NextResponse } from 'next/server';
import { validateAdminPassword } from '@/lib/services/auth';

/**
 * 管理员登录
 */
export async function POST(request: NextRequest) {
    try {
        // 解析请求体
        const { password } = await request.json();

        // 验证必填字段
        if (!password) {
            return NextResponse.json(
                { success: false, message: '请输入管理员密码' },
                { status: 400 }
            );
        }

        // 验证管理员密码
        if (!validateAdminPassword(password)) {
            return NextResponse.json(
                { success: false, message: '管理员密码验证失败' },
                { status: 401 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('管理员登录失败:', error);
        return NextResponse.json(
            { success: false, message: '登录失败，请稍后重试' },
            { status: 500 }
        );
    }
} 