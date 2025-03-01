import { NextRequest, NextResponse } from 'next/server';
import { validateAdminPassword } from '@/lib/auth';
import { getAllTemplates, createTemplate, deleteTemplate } from '@/lib/templates';
import { CreateTemplateDTO } from '@/types/templates';
import { getDb } from '@/lib/db';

// 获取模板列表
export async function GET(req: NextRequest) {
    try {
        const authError = await validateAdminPassword(req);
        if (authError) return authError;

        // 确保数据库连接可用
        await getDb();
        const templates = await getAllTemplates();
        return NextResponse.json({ success: true, data: templates });
    } catch (error) {
        console.error('Get templates error:', error);
        return NextResponse.json(
            { success: false, message: '获取模板列表失败' },
            { status: 500 }
        );
    }
}

// 创建新模板
export async function POST(req: NextRequest) {
    try {
        const authError = await validateAdminPassword(req);
        if (authError) return authError;

        // 确保数据库连接可用
        await getDb();
        const data = await req.json() as CreateTemplateDTO;

        // 验证必填字段
        if (!data.name?.trim()) {
            return NextResponse.json(
                { success: false, message: '应用名称不能为空' },
                { status: 400 }
            );
        }

        const template = await createTemplate(data);
        return NextResponse.json({ success: true, data: template });
    } catch (error) {
        console.error('Create template error:', error);
        return NextResponse.json(
            { success: false, message: '创建模板失败' },
            { status: 500 }
        );
    }
}

// 删除模板
export async function DELETE(req: NextRequest) {
    try {
        const authError = await validateAdminPassword(req);
        if (authError) return authError;

        // 确保数据库连接可用
        await getDb();
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, message: '模板ID不能为空' },
                { status: 400 }
            );
        }

        const success = await deleteTemplate(id);
        if (!success) {
            return NextResponse.json(
                { success: false, message: '模板不存在或删除失败' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete template error:', error);
        return NextResponse.json(
            { success: false, message: '删除模板失败' },
            { status: 500 }
        );
    }
} 