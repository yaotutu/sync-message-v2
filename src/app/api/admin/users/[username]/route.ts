import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/services/auth';
import { deleteUser, getUserByUsername } from '@/lib/services/users';

/**
 * 获取单个用户信息
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { username: string } }
) {
    try {
        console.log(`收到管理员获取用户信息请求: ${params.username}`);

        // 验证管理员权限
        const authResult = verifyAdminAuth(request);
        if (!authResult.success) {
            console.log('错误: 管理员验证失败');
            return NextResponse.json(
                { success: false, message: '未授权访问' },
                { status: 401 }
            );
        }

        // 获取用户信息
        const result = await getUserByUsername(params.username);
        if (result.success && result.data) {
            console.log(`成功获取用户信息: ${params.username}`);
        } else {
            console.log(`获取用户信息失败: ${result.message || '未知错误'}`);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('获取用户信息失败:', error);
        return NextResponse.json(
            { success: false, message: '获取用户信息失败' },
            { status: 500 }
        );
    }
}

/**
 * 删除用户
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { username: string } }
) {
    try {
        console.log(`收到管理员删除用户请求: ${params.username}`);

        // 验证管理员权限
        const authResult = verifyAdminAuth(request);
        if (!authResult.success) {
            console.log('错误: 管理员验证失败');
            return NextResponse.json(
                { success: false, message: '未授权访问' },
                { status: 401 }
            );
        }

        // 删除用户
        console.log(`尝试删除用户: ${params.username}`);
        const result = await deleteUser(params.username);

        if (result.success && result.data) {
            console.log(`用户删除成功: ${params.username}, 删除状态: ${result.data.deleted}`);
        } else {
            console.log(`用户删除失败: ${result.message || '未知错误'}`);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('删除用户失败:', error);
        return NextResponse.json(
            { success: false, message: '删除用户失败' },
            { status: 500 }
        );
    }
} 