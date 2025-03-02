import { NextRequest, NextResponse } from 'next/server';
import { getTemplateByName } from '@/lib/services/templates';

/**
 * 根据名称获取模板
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { name: string } }
) {
    try {
        const { name } = params;
        console.log(`收到获取模板请求，模板名称: ${name}`);

        if (!name) {
            console.log('错误: 模板名称不能为空');
            return NextResponse.json(
                { success: false, message: '模板名称不能为空' },
                { status: 400 }
            );
        }

        // 获取模板
        const template = await getTemplateByName(name);
        if (!template) {
            console.log(`错误: 模板不存在 - ${name}`);
            return NextResponse.json(
                { success: false, message: '模板不存在' },
                { status: 404 }
            );
        }

        console.log(`成功获取模板: ${template.name}, ID: ${template.id}, 规则数量: ${template.rules.length}`);
        return NextResponse.json({ success: true, data: template });
    } catch (error) {
        console.error('获取模板失败:', error);
        return NextResponse.json(
            { success: false, message: '获取模板失败' },
            { status: 500 }
        );
    }
} 