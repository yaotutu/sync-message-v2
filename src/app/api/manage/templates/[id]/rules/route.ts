import { NextRequest, NextResponse } from 'next/server';
import { validateAdminPassword } from '@/lib/auth';
import { addRule, deleteRule } from '@/lib/templates';
import { getDb } from '@/lib/db';
import { CreateRuleDTO } from '@/types/templates';

// 添加规则
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authError = await validateAdminPassword(req);
        if (authError) return authError;

        // 确保数据库连接可用
        await getDb();
        const data = await req.json() as CreateRuleDTO;

        // 验证必填字段
        if (!data.pattern?.trim()) {
            return NextResponse.json(
                { success: false, message: '规则表达式不能为空' },
                { status: 400 }
            );
        }

        // 验证正则表达式是否有效
        if (data.mode === 'regex') {
            try {
                new RegExp(data.pattern);
            } catch (e) {
                return NextResponse.json(
                    { success: false, message: '无效的正则表达式' },
                    { status: 400 }
                );
            }
        }

        const rule = await addRule(params.id, data);
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
    try {
        const authError = await validateAdminPassword(req);
        if (authError) return authError;

        // 确保数据库连接可用
        await getDb();
        const { searchParams } = new URL(req.url);
        const ruleId = searchParams.get('ruleId');

        if (!ruleId) {
            return NextResponse.json(
                { success: false, message: '规则ID不能为空' },
                { status: 400 }
            );
        }

        const success = await deleteRule(params.id, ruleId);
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