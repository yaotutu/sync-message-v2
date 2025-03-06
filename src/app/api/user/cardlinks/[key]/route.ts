import { NextRequest, NextResponse } from 'next/server';
import { validateUser } from '@/lib/services/users';
import { deleteCardLink } from '@/lib/db/cardlinks';

export async function DELETE(
    request: NextRequest,
    { params }: { params: { key: string } }
) {
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

        // 验证用户
        const validateResult = await validateUser(username, password);
        if (!validateResult.success) {
            console.log(`错误: 用户验证失败，用户: ${username}`);
            return NextResponse.json(validateResult, { status: 401 });
        }
        console.log(`用户验证成功: ${username}`);

        // 删除卡密链接
        const success = await deleteCardLink(username, params.key);
        if (!success) {
            return NextResponse.json(
                { success: false, message: '删除失败，可能是卡密链接不存在或已被使用' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('删除卡密链接失败:', error);
        return NextResponse.json(
            { success: false, message: '删除卡密链接失败' },
            { status: 500 }
        );
    }
} 