import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { validateUser } from '@/lib/services/users';

export async function POST(request: NextRequest) {
    try {
        console.log('收到删除卡密链接请求');

        // 获取用户名和密码
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

        // 获取请求体
        const body = await request.json();
        const { keys } = body;

        // 验证参数
        if (!Array.isArray(keys) || keys.length === 0) {
            console.log('错误: 未提供要删除的卡密key列表');
            return NextResponse.json({
                success: false,
                message: '请提供要删除的卡密key列表'
            }, { status: 400 });
        }

        // 验证用户
        const validateResult = await validateUser(username, password);
        if (!validateResult.success) {
            console.log(`错误: 用户验证失败，用户: ${username}`);
            return NextResponse.json(validateResult, { status: 401 });
        }
        console.log(`用户验证成功: ${username}`);

        // 删除卡密链接
        let deletedCount = 0;
        for (const key of keys) {
            const result = await sql`
                DELETE FROM card_links 
                WHERE username = ${username}
                AND key = ${key}
                AND first_used_at IS NULL
            `;
            if (result.changes) {
                deletedCount += result.changes;
            }
        }

        console.log(`删除结果: ${deletedCount} 个卡密链接被删除`);

        return NextResponse.json({
            success: true,
            message: `成功删除 ${deletedCount} 个卡密链接`,
            data: {
                deletedCount
            }
        });
    } catch (error) {
        console.error('Delete card links error:', error);
        return NextResponse.json({
            success: false,
            message: '删除卡密链接失败，请稍后重试'
        }, { status: 500 });
    }
} 