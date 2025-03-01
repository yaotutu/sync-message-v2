import { NextRequest, NextResponse } from 'next/server';
import { validateAdminPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        if (!password) {
            return NextResponse.json(
                { success: false, message: '请输入管理员密码' },
                { status: 400 }
            );
        }

        const authError = await validateAdminPassword(request);
        if (authError) {
            return authError;
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json(
            { success: false, message: '登录失败，请稍后重试' },
            { status: 500 }
        );
    }
} 