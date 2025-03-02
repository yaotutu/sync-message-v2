import { NextRequest, NextResponse } from 'next/server';
import { sqlQuery } from '@/lib/db';

interface TemplateName {
    id: string;
    name: string;
}

/**
 * 获取所有模板名称
 */
export async function GET(request: NextRequest) {
    try {
        console.log('收到获取模板名称列表请求');

        // 只获取模板的ID和名称
        const templates = await sqlQuery<TemplateName>`
            SELECT 
                id,
                name
            FROM templates
            ORDER BY name ASC
        `;

        console.log(`成功获取 ${templates.length} 个模板名称`);
        if (templates.length > 0) {
            console.log('模板名称列表:');
            templates.forEach((template, index) => {
                console.log(`${index + 1}. ${template.name} (ID: ${template.id})`);
            });
        }

        return NextResponse.json({
            success: true,
            data: templates
        });
    } catch (error) {
        console.error('获取模板名称列表失败:', error);
        return NextResponse.json(
            { success: false, message: '获取模板名称列表失败' },
            { status: 500 }
        );
    }
} 