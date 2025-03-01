import { NextRequest, NextResponse } from 'next/server';
import { getMessages } from '@/lib/db/messages';

export async function GET(request: NextRequest) {
    try {
        const cardKey = request.headers.get('x-card-key');

        if (!cardKey) {
            return NextResponse.json(
                { success: false, message: '请提供卡密' },
                { status: 400 }
            );
        }

        const result = await getMessages(cardKey);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Get messages error:', error);
        return NextResponse.json(
            { success: false, message: '获取消息失败，请稍后重试' },
            { status: 500 }
        );
    }
} 