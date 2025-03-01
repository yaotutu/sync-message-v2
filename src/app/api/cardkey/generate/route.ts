import { NextRequest, NextResponse } from 'next/server';
import { validateUser } from '@/lib/db/users';
import { addCardKey } from '@/lib/db/cards';

export async function GET(request: NextRequest) {
    try {
        // 验证用户身份
        const username = request.headers.get('x-username');
        const password = request.headers.get('x-password');

        if (!username || !password) {
            return NextResponse.json({ success: false, message: '请提供用户名和密码' }, { status: 401 });
        }

        const validateResult = await validateUser(username, password);
        if (!validateResult.success) {
            return NextResponse.json(validateResult, { status: 401 });
        }

        // 获取要生成的卡密数量
        const searchParams = request.nextUrl.searchParams;
        const count = Number(searchParams.get('count')) || 1;

        if (isNaN(count) || count < 1 || count > 20) {
            return NextResponse.json({ success: false, message: '无效的数量参数' }, { status: 400 });
        }

        // 生成卡密
        const keys = [];
        for (let i = 0; i < count; i++) {
            const result = await addCardKey(username);
            if (result.success && result.data) {
                keys.push(result.data);
            }
        }

        return NextResponse.json({
            success: true,
            data: keys,
            message: `成功生成 ${keys.length} 个卡密`
        });
    } catch (error) {
        console.error('Generate card key error:', error);
        return NextResponse.json({
            success: false,
            message: '生成卡密失败，请稍后重试'
        }, { status: 500 });
    }
} 