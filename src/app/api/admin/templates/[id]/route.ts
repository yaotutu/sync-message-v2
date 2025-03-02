import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/services/auth';
import {
    getTemplateById,
    updateTemplate,
    deleteTemplate
} from '@/lib/services/templates';
import { UpdateTemplateDTO } from '@/types';

/**
 * 获取单个模板
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // 验证管理员权限
        const authResult = verifyAdminAuth(request);
        if (!authResult.success) {
            return NextResponse.json(
                { success: false, message: '未授权访问' },
                { status: 401 }
            );
        }

        const { id } = params;
        if (!id) {
            return NextResponse.json(
                { success: false, message: '模板ID不能为空' },
                { status: 400 }
            );
        }

        // 获取模板
        const template = await getTemplateById(id);
        if (!template) {
            return NextResponse.json(
                { success: false, message: '模板不存在' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: template });
    } catch (error) {
        console.error('获取模板详情失败:', error);
        return NextResponse.json(
            { success: false, message: '获取模板详情失败' },
            { status: 500 }
        );
    }
}

/**
 * 更新模板
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // 验证管理员权限
        const authResult = verifyAdminAuth(request);
        if (!authResult.success) {
            return NextResponse.json(
                { success: false, message: '未授权访问' },
                { status: 401 }
            );
        }

        const { id } = params;
        if (!id) {
            return NextResponse.json(
                { success: false, message: '模板ID不能为空' },
                { status: 400 }
            );
        }

        // 解析请求体
        const data = await request.json() as UpdateTemplateDTO;

        // 更新模板
        const template = await updateTemplate(id, data);
        if (!template) {
            return NextResponse.json(
                { success: false, message: '模板不存在或更新失败' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: template });
    } catch (error) {
        console.error('更新模板失败:', error);
        return NextResponse.json(
            { success: false, message: '更新模板失败' },
            { status: 500 }
        );
    }
}

/**
 * 删除模板
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // 验证管理员权限
        const authResult = verifyAdminAuth(request);
        if (!authResult.success) {
            return NextResponse.json(
                { success: false, message: '未授权访问' },
                { status: 401 }
            );
        }

        const { id } = params;
        if (!id) {
            return NextResponse.json(
                { success: false, message: '模板ID不能为空' },
                { status: 400 }
            );
        }

        // 删除模板
        const success = await deleteTemplate(id);
        if (!success) {
            return NextResponse.json(
                { success: false, message: '模板不存在或删除失败' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('删除模板失败:', error);
        return NextResponse.json(
            { success: false, message: '删除模板失败' },
            { status: 500 }
        );
    }
} 