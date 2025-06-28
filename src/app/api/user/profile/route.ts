import { NextRequest, NextResponse } from 'next/server';
import { validateUser, updateUserProfile } from '@/lib/services/users';

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

/**
 * 更新用户设置
 */
export async function PATCH(request: NextRequest) {
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

        // 获取请求体
        const body = await request.json();

        // 验证请求体
        if (!body || typeof body !== 'object') {
            return NextResponse.json(
                { success: false, message: '请求体格式错误' },
                { status: 400 }
            );
        }

        // 只允许更新特定字段
        const allowedFields = ['cardLinkTags'];
        const updates: Record<string, any> = {};

        for (const field of allowedFields) {
            if (field in body) {
                updates[field] = body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return NextResponse.json(
                { success: false, message: '没有提供有效的更新字段' },
                { status: 400 }
            );
        }

        // 更新用户设置
        const updateResult = await updateUserProfile(username, updates);
        if (!updateResult.success) {
            return NextResponse.json(updateResult, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: '用户设置更新成功'
        });
    } catch (error) {
        console.error('更新用户设置失败:', error);
        return NextResponse.json(
            { success: false, message: '更新用户设置失败' },
            { status: 500 }
        );
    }
} 