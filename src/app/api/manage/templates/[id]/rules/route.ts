import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminPassword } from '@/lib/auth';
import { addRule, deleteRule } from '@/lib/templates';
import { CreateRuleDTO } from '@/types/templates';

// 添加规则
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const authError = await verifyAdminPassword(req);
    if (authError) return authError;

    try {
        const data = await req.json() as CreateRuleDTO;

        // 验证必填字段
        if (!data.pattern?.trim()) {
            return NextResponse.json(
                { success: false, message: '规则表达式不能为空' },
                { status: 400 }
            );
        }

        // 验证正则表达式是否有效
        try {
            new RegExp(data.pattern);
        } catch (e) {
            return NextResponse.json(
                { success: false, message: '无效的正则表达式' },
                { status: 400 }
            );
        }

        const rule = addRule(params.id, data);
        if (!rule) {
            return NextResponse.json(
                { success: false, message: '模板不存在' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: rule });
    } catch (error) {
        console.error('Add rule error:', error);
        return NextResponse.json(
            { success: false, message: '添加规则失败' },
            { status: 500 }
        );
    }
}

// 删除规则
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const authError = await verifyAdminPassword(req);
    if (authError) return authError;

    try {
        const { searchParams } = new URL(req.url);
        const ruleId = searchParams.get('ruleId');

        if (!ruleId) {
            return NextResponse.json(
                { success: false, message: '规则ID不能为空' },
                { status: 400 }
            );
        }

        const success = deleteRule(params.id, ruleId);
        if (!success) {
            return NextResponse.json(
                { success: false, message: '模板或规则不存在' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete rule error:', error);
        return NextResponse.json(
            { success: false, message: '删除规则失败' },
            { status: 500 }
        );
    }
} 