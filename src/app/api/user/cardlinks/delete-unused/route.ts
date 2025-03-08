import { NextRequest, NextResponse } from 'next/server';
import { validateUser } from '@/lib/services/users';
import { sql } from '@/lib/db';

export async function DELETE(request: NextRequest) {
    try {
        console.log('收到批量删除未使用卡密链接请求');

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

        // 验证用户
        const validateResult = await validateUser(username, password);
        if (!validateResult.success) {
            console.log(`错误: 用户验证失败，用户: ${username}`);
            return NextResponse.json(validateResult, { status: 401 });
        }
        console.log(`用户验证成功: ${username}`);

        // 先获取要删除的数量
        const countResult = await sql`
            SELECT COUNT(*) as count 
            FROM card_links 
            WHERE username = ${username} 
            AND first_used_at IS NULL
        `;

        const toDeleteCount = Number(countResult[0]?.count) || 0;

        // 执行删除操作
        await sql`
            DELETE FROM card_links 
            WHERE username = ${username} 
            AND first_used_at IS NULL
        `;

        console.log(`删除结果: ${toDeleteCount} 个卡密链接被删除`);

        return NextResponse.json({
            success: true,
            message: `成功删除 ${toDeleteCount} 个未使用的卡密链接`,
            count: toDeleteCount
        });
    } catch (error) {
        console.error('批量删除卡密链接失败:', error);
        return NextResponse.json(
            { success: false, message: '批量删除卡密链接失败' },
            { status: 500 }
        );
    }
} 