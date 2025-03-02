import { NextRequest, NextResponse } from 'next/server';
import { validateUser } from '@/lib/services/users';

/**
 * Webhook登录API
 */
export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: '用户名和密码不能为空' },
                { status: 400 }
            );
        }

        const result = await validateUser(username, password);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Webhook登录失败:', error);
        return NextResponse.json(
            { success: false, message: '登录失败，请稍后重试' },
            { status: 500 }
        );
    }
} 