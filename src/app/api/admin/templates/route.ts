import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/services/auth';
import {
    getAllTemplates,
    createTemplate,
    getTemplateById,
    updateTemplate,
    deleteTemplate
} from '@/lib/services/templates';
import { CreateTemplateDTO, UpdateTemplateDTO } from '@/types';

/**
 * 获取所有模板
 */
export async function GET(request: NextRequest) {
    try {
        // 验证管理员权限
        const authResult = verifyAdminAuth(request);
        if (!authResult.success) {
            return NextResponse.json({ success: false, message: '未授权访问' }, { status: 401 });
        }

        // 获取所有模板
        const templates = await getAllTemplates();
        return NextResponse.json({ success: true, data: templates });
    } catch (error) {
        console.error('获取模板失败:', error);
        return NextResponse.json(
            { success: false, message: '获取模板失败' },
            { status: 500 }
        );
    }
}

/**
 * 创建模板
 */
export async function POST(request: NextRequest) {
    try {
        // 验证管理员权限
        const authResult = verifyAdminAuth(request);
        if (!authResult.success) {
            return NextResponse.json({ success: false, message: '未授权访问' }, { status: 401 });
        }

        // 解析请求体
        const data = await request.json() as CreateTemplateDTO;

        // 验证必填字段
        if (!data.name) {
            return NextResponse.json(
                { success: false, message: '模板名称不能为空' },
                { status: 400 }
            );
        }

        // 创建模板
        const template = await createTemplate(data);
        return NextResponse.json({ success: true, data: template });
    } catch (error) {
        console.error('创建模板失败:', error);
        return NextResponse.json(
            { success: false, message: '创建模板失败' },
            { status: 500 }
        );
    }
} 