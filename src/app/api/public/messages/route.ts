import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { addMessage } from '@/lib/services/messages';

export async function GET(request: Request) {
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

export async function POST(request: Request) {
  try {
    const { cardKey, appName, phone, smsContent, recTime } = await request.json();

    if (!cardKey || !appName || !smsContent) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // 获取卡密链接对应的用户名
    const cardLink = await prisma.cardLink.findUnique({
      where: { key: cardKey },
    });

    if (!cardLink) {
      return NextResponse.json(
        { success: false, error: '无效的卡密链接' },
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    // 更新卡密链接的first_used_at（如果是第一次使用）
    if (!cardLink.firstUsedAt) {
      await prisma.cardLink.update({
        where: { key: cardKey },
        data: { firstUsedAt: Date.now() },
      });
    }

    // 添加消息
    const result = await addMessage(cardLink.username, smsContent, recTime);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    return NextResponse.json(
      { success: true },
      { headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('处理消息失败:', error);
    return NextResponse.json(
      { success: false, error: '处理消息失败' },
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
