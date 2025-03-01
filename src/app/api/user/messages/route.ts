import { NextRequest, NextResponse } from 'next/server';
import { getMessages } from '@/lib/db/messages';
import { validateUser } from '@/lib/db/users';

export async function GET(request: NextRequest) {
    try {
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

        const result = await getMessages(username);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Get user messages error:', error);
        return NextResponse.json(
            { success: false, message: '获取消息失败，请稍后重试' },
            { status: 500 }
        );
    }
} 