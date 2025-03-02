import { NextRequest, NextResponse } from 'next/server';
import { getUserMessages } from '@/lib/db/messages';
import { validateUser } from '@/lib/db/users';

/**
 * 获取用户的消息列表
 */
export async function GET(request: NextRequest) {
    try {
        console.log('收到获取用户消息请求');

        const username = request.headers.get('x-username');
        const password = request.headers.get('x-password');
        console.log(`请求头: username=${username}, password=${password ? '已提供' : '未提供'}`);

        if (!username || !password) {
            console.log('错误: 缺少用户名或密码');
            return NextResponse.json(
                { success: false, message: '请提供用户名和密码' },
                { status: 401 }
            );
        }

        // 验证用户
        const validateResult = await validateUser(username, password);
        if (!validateResult.success) {
            console.log(`错误: 用户验证失败，用户: ${username}`);
            return NextResponse.json(validateResult, { status: 401 });
        }
        console.log(`用户验证成功: ${username}`);

        // 获取用户消息
        const result = await getUserMessages(username);
        if (result.success && 'data' in result) {
            console.log(`成功获取用户 ${username} 的 ${result.data.length} 条消息`);
        } else {
            console.log(`获取用户 ${username} 的消息失败: ${result.success ? '未知错误' : '请求失败'}`);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('获取用户消息失败:', error);
        return NextResponse.json(
            { success: false, message: '获取消息失败，请稍后重试' },
            { status: 500 }
        );
    }
} 