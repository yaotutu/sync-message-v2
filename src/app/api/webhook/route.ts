import { NextRequest, NextResponse } from 'next/server';
import { addMessage } from '@/lib/services/messages';
import { getUserByUsername } from '@/lib/services/users';

/**
 * Webhook API - 接收消息
 */
export async function POST(request: NextRequest) {
    try {
        console.log('收到webhook消息请求');

        const username = request.headers.get('x-username');
        const webhookKey = request.headers.get('x-webhook-key');
        const webhookType = request.headers.get('x-webhook-type');
        console.log(`请求头: username=${username}, webhookKey=${webhookKey ? '已提供' : '未提供'}, type=${webhookType}`);

        if (!username || !webhookKey || !webhookType) {
            console.log('错误: 缺少必要的请求头');
            return NextResponse.json(
                { success: false, message: '缺少必要的请求头 (需要 x-username, x-webhook-key 和 x-webhook-type)' },
                { status: 400 }
            );
        }

        // 验证消息类型
        if (!['SMS', 'EMAIL'].includes(webhookType.toUpperCase())) {
            console.log(`错误: 不支持的消息类型: ${webhookType}`);
            return NextResponse.json(
                { success: false, message: '不支持的消息类型，只支持 SMS 或 EMAIL' },
                { status: 400 }
            );
        }

        // 验证 webhook key
        const userResult = await getUserByUsername(username);
        if (!userResult.success || !userResult.data || userResult.data.webhookKey !== webhookKey) {
            console.log(`错误: Webhook Key 验证失败，用户: ${username}`);
            return NextResponse.json(
                { success: false, message: 'Webhook Key 验证失败' },
                { status: 401 }
            );
        }
        console.log(`用户验证成功: ${username}`);

        const body = await request.json();

        // 验证请求体
        if (!body.smsContent) {
            console.log('错误: 缺少消息内容');
            return NextResponse.json(
                { success: false, message: '缺少消息内容 (smsContent)' },
                { status: 400 }
            );
        }

        const receivedAt = body.receivedAt || Date.now();
        console.log(`消息内容: ${body.smsContent ? body.smsContent.substring(0, 50) + '...' : '无内容'}`);
        console.log(`接收时间: ${new Date(receivedAt).toISOString()}, 原始时间: ${body.recTime || '未提供'}`);
        console.log(`消息类型: ${webhookType.toUpperCase()}`);

        const result = await addMessage(
            username,
            body.smsContent,
            body.recTime,
            Number(receivedAt),
            webhookType.toUpperCase()
        );
        console.log(`消息添加结果: ${result.success ? '成功' : '失败'}, ${result.message || ''}`);

        return NextResponse.json(result);
    } catch (error) {
        console.error('处理webhook请求失败:', error);
        return NextResponse.json(
            { success: false, message: '处理webhook请求失败，请稍后重试' },
            { status: 500 }
        );
    }
}