import { NextRequest, NextResponse } from 'next/server';
import { getTemplateByName, getAllTemplates } from '@/lib/services/templates';

/**
 * 获取模板列表或根据应用名称获取模板
 */
export async function GET(request: NextRequest) {
    try {
        console.log('收到获取模板列表请求');

        // 获取查询参数
        const searchParams = request.nextUrl.searchParams;
        const appName = searchParams.get('name');
        console.log(`查询参数: name=${appName || '未提供'}`);

        // 如果提供了应用名称，则获取特定模板
        if (appName) {
            console.log(`尝试获取特定模板: ${appName}`);

            // 获取模板
            const template = await getTemplateByName(appName);
            if (!template) {
                console.log(`错误: 模板不存在 - ${appName}`);
                return NextResponse.json(
                    { success: false, message: '模板不存在' },
                    { status: 404 }
                );
            }

            console.log(`成功获取模板: ${template.name}, ID: ${template.id}, 规则数量: ${template.rules.length}`);
            return NextResponse.json({ success: true, data: template });
        }

        // 否则获取所有模板
        console.log('获取所有模板');
        const templates = await getAllTemplates();
        console.log(`成功获取 ${templates.length} 个模板`);

        return NextResponse.json({ success: true, data: templates });
    } catch (error) {
        console.error('获取模板失败:', error);
        return NextResponse.json(
            { success: false, message: '获取模板失败' },
            { status: 500 }
        );
    }
} 