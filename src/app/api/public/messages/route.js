import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const cardKey = searchParams.get('cardKey');
        const appName = searchParams.get('appName');
        const phone = searchParams.get('phone');

        if (!cardKey) {
            return NextResponse.json(
                { success: false, error: '缺少卡密参数' },
                { status: 400, headers: { 'Content-Type': 'application/json' } },
            );
        }

        // 获取卡密链接信息
        const cardLink = await prisma.cardLink.findUnique({
            where: { key: cardKey },
            select: { username: true, firstUsedAt: true },
        });

        if (!cardLink) {
            return NextResponse.json(
                { success: false, error: '无效的卡密链接' },
                { status: 400, headers: { 'Content-Type': 'application/json' } },
            );
        }

        // 获取最新消息
        const latestMessage = await prisma.message.findFirst({
            where: { username: cardLink.username },
            orderBy: { receivedAt: 'desc' },
            select: { smsContent: true },
        });

        return NextResponse.json(
            {
                success: true,
                message: latestMessage?.smsContent || '',
                firstUsedAt: cardLink.firstUsedAt,
            },
            { headers: { 'Content-Type': 'application/json' } },
        );
    } catch (error) {
        console.error('获取消息失败:', error);
        return NextResponse.json(
            { success: false, error: '获取消息失败' },
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
} 