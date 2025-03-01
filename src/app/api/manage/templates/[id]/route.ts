import { NextRequest, NextResponse } from 'next/server';
import { validateAdminPassword } from '@/lib/auth';
import { deleteTemplate, getTemplateById, updateTemplate } from '@/lib/templates';
import { getDb } from '@/lib/db';
import { UpdateTemplateDTO } from '@/types/templates';

// 获取单个模板
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authError = await validateAdminPassword(req);
        if (authError) return authError;

        // 确保数据库连接可用
        await getDb();
        const template = await getTemplateById(params.id);

        if (!template) {
            return NextResponse.json(
                { success: false, message: '模板不存在' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: template });
    } catch (error) {
        console.error('Get template error:', error);
        return NextResponse.json(
            { success: false, message: '获取模板失败' },
            { status: 500 }
        );
    }
}

// 删除模板
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authError = await validateAdminPassword(req);
        if (authError) return authError;

        // 确保数据库连接可用
        await getDb();
        const success = await deleteTemplate(params.id);

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

// 更新模板
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authError = await validateAdminPassword(req);
        if (authError) return authError;

        // 确保数据库连接可用
        await getDb();
        const data = await req.json();

        // 验证是否有需要更新的字段
        if (!data.name?.trim()) {
            return NextResponse.json(
                { success: false, message: '应用名称不能为空' },
                { status: 400 }
            );
        }

        if (!Array.isArray(data.rules) || data.rules.length === 0) {
            return NextResponse.json(
                { success: false, message: '至少需要一条规则' },
                { status: 400 }
            );
        }

        if (data.rules.some((rule: any) => !rule.pattern?.trim())) {
            return NextResponse.json(
                { success: false, message: '规则表达式不能为空' },
                { status: 400 }
            );
        }

        const template = await updateTemplate(params.id, data);
        if (!template) {
            return NextResponse.json(
                { success: false, message: '模板不存在或更新失败' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: template });
    } catch (error) {
        console.error('Update template error:', error);
        return NextResponse.json(
            { success: false, message: '更新模板失败' },
            { status: 500 }
        );
    }
} 