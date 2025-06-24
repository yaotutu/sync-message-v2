import { NextRequest, NextResponse } from 'next/server';
import { validateUser } from '@/lib/services/users';

/**
 * 获取当前用户信息
 */
export async function GET(request: NextRequest) {
    try {
        // 验证用户
        const username = request.headers.get('x-username');
        const password = request.headers.get('x-password');

        if (!username || !password) {
            return NextResponse.json(
                { success: false, message: '请提供用户名和密码' },
                { status: 401 }
            );
        }

        const validateResult = await validateUser(username, password);
        if (!validateResult.success) {
            return NextResponse.json(validateResult, { status: 401 });
        }

        // 返回用户信息
        return NextResponse.json({
            success: true,
            data: validateResult.data
        });
    } catch (error) {
        console.error('获取用户信息失败:', error);
        return NextResponse.json(
            { success: false, message: '获取用户信息失败' },
            { status: 500 }
        );
    }
} 