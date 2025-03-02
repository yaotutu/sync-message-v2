import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/services/auth';
import { addRule, deleteRule } from '@/lib/services/templates';
import { CreateRuleDTO } from '@/types';

/**
 * 添加规则
 */
export async function POST(
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
        const data = await request.json() as CreateRuleDTO;

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

        // 添加规则
        const rule = await addRule(id, data);
        if (!rule) {
            return NextResponse.json(
                { success: false, message: '模板不存在或添加规则失败' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true, data: rule });
    } catch (error) {
        console.error('添加规则失败:', error);
        return NextResponse.json(
            { success: false, message: '添加规则失败' },
            { status: 500 }
        );
    }
}

/**
 * 删除规则
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

        // 获取规则ID
        const { searchParams } = new URL(request.url);
        const ruleId = searchParams.get('ruleId');

        if (!ruleId) {
            return NextResponse.json(
                { success: false, message: '规则ID不能为空' },
                { status: 400 }
            );
        }

        // 删除规则
        const success = await deleteRule(id, ruleId);
        if (!success) {
            return NextResponse.json(
                { success: false, message: '模板或规则不存在' },
                { status: 404 }
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('删除规则失败:', error);
        return NextResponse.json(
            { success: false, message: '删除规则失败' },
            { status: 500 }
        );
    }
} 