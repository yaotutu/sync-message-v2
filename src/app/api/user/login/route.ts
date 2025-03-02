import { NextRequest, NextResponse } from 'next/server';
import { validateUser } from '@/lib/services/users';

/**
 * 用户登录
 */
export async function POST(request: NextRequest) {
    try {
        // 解析请求体
        const body = await request.json();
        const { username, password } = body;

        // 验证必填字段
        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: '用户名和密码不能为空' },
                { status: 400 }
            );
        }

        // 验证用户
        const result = await validateUser(username, password);
        return NextResponse.json(result);
    } catch (error) {
        console.error('用户登录失败:', error);
        return NextResponse.json(
            { success: false, message: '登录失败，请稍后重试' },
            { status: 500 }
        );
    }
} 