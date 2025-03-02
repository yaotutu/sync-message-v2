import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/services/auth';
import { getAllUsers, createUser } from '@/lib/services/users';

/**
 * 获取所有用户 (管理员API)
 */
export async function GET(request: NextRequest) {
    try {
        console.log('收到管理员获取所有用户请求');

        // 验证管理员权限
        const authResult = verifyAdminAuth(request);
        if (!authResult.success) {
            console.log('错误: 管理员验证失败');
            return NextResponse.json(
                { success: false, message: '未授权访问' },
                { status: 401 }
            );
        }

        // 获取所有用户
        const result = await getAllUsers();
        if (result.success && result.data) {
            console.log(`成功获取 ${result.data.length} 个用户`);
        } else {
            console.log(`获取用户失败: ${result.message || '未知错误'}`);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('获取所有用户失败:', error);
        return NextResponse.json(
            { success: false, message: '获取用户失败' },
            { status: 500 }
        );
    }
}

/**
 * 创建用户
 */
export async function POST(request: NextRequest) {
    try {
        console.log('收到管理员创建用户请求');

        // 验证管理员权限
        const authResult = verifyAdminAuth(request);
        if (!authResult.success) {
            console.log('错误: 管理员验证失败');
            return NextResponse.json(
                { success: false, message: '未授权访问' },
                { status: 401 }
            );
        }

        // 解析请求体
        const body = await request.json();
        const { username, password } = body;
        console.log(`请求参数: username=${username}, password=${password ? '已提供' : '未提供'}`);

        // 验证必填字段
        if (!username || !password) {
            console.log('错误: 用户名或密码为空');
            return NextResponse.json(
                { success: false, message: '用户名和密码不能为空' },
                { status: 400 }
            );
        }

        // 创建用户
        console.log(`尝试创建用户: ${username}`);
        const result = await createUser(username, password);

        if (result.success && result.data) {
            console.log(`用户创建成功: ${username}, ID: ${result.data.id}`);
        } else {
            console.log(`用户创建失败: ${result.message || '未知错误'}`);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error('创建用户失败:', error);
        return NextResponse.json(
            { success: false, message: '创建用户失败' },
            { status: 500 }
        );
    }
} 