import { NextRequest, NextResponse } from 'next/server';
import { addMessage } from '@/lib/db/messages';
import { getUser } from '@/lib/db/users';

export async function POST(request: NextRequest) {
    try {
        const username = request.headers.get('x-username');
        const webhookKey = request.headers.get('x-webhook-key');

        if (!username || !webhookKey) {
            return NextResponse.json(
                { success: false, message: '缺少必要的请求头' },
                { status: 400 }
            );
        }

        // 验证 webhook key
        const userResult = await getUser(username);
        if (!userResult.success || !userResult.data || userResult.data.webhookKey !== webhookKey) {
            return NextResponse.json(
                { success: false, message: 'Webhook Key 验证失败' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const received_at = body.received_at || Date.now();

        const result = await addMessage(username, body.sms_content, body.rec_time, received_at);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json(
            { success: false, message: '处理webhook请求失败，请稍后重试' },
            { status: 500 }
        );
    }
}