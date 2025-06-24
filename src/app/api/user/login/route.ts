import { NextRequest, NextResponse } from 'next/server';
import { validateUser } from '@/lib/services/users';
import { isAccountActive } from '@/lib/utils/account';

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

        // 如果用户验证失败，直接返回错误
        if (!result.success) {
            return NextResponse.json(result);
        }

        // 检查账号有效期
        const user = result.data;
        if (!isAccountActive(user.expiryDate)) {
            return NextResponse.json(
                {
                    success: false,
                    message: '账号已过期，请联系管理员'
                },
                { status: 403 }
            );
        }

        // 登录成功
        return NextResponse.json({
            success: true,
            message: '登录成功',
            data: {
                username: user.username,
                canManageTemplates: user.canManageTemplates,
                expiryDate: user.expiryDate,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('用户登录失败:', error);
        return NextResponse.json(
            { success: false, message: '登录失败，请稍后重试' },
            { status: 500 }
        );
    }
} 