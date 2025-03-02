import { NextRequest, NextResponse } from 'next/server';
import { getCardLink } from '@/lib/db/cardlinks';

/**
 * 测试卡密链接API - 直接调用getCardLink函数
 */
export async function GET(request: NextRequest) {
    try {
        console.log('收到测试卡密链接请求');

        // 获取查询参数
        const { searchParams } = new URL(request.url);
        const cardKey = searchParams.get('cardKey');

        console.log(`请求参数: cardKey=${cardKey}`);
        console.log(`请求头: ${JSON.stringify(Object.fromEntries(request.headers))}`);

        // 验证必要参数
        if (!cardKey) {
            console.log('错误: 缺少cardKey参数');
            return new NextResponse(
                JSON.stringify({ success: false, message: '缺少卡密参数' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        // 获取卡密链接
        console.log(`开始获取卡密链接: ${cardKey}`);
        try {
            const cardLink = await getCardLink(cardKey);
            if (!cardLink) {
                console.log(`错误: 无效的卡密 ${cardKey}`);
                return new NextResponse(
                    JSON.stringify({ success: false, message: '无效的卡密' }),
                    {
                        status: 404,
                        headers: { 'Content-Type': 'application/json' }
                    }
                );
            }
            console.log(`找到卡密链接: ${JSON.stringify(cardLink)}`);

            // 返回卡密链接信息
            return new NextResponse(
                JSON.stringify({
                    success: true,
                    message: '找到卡密链接',
                    data: {
                        cardLink
                    }
                }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        } catch (error: any) {
            console.error(`获取卡密链接失败:`, error);
            return new NextResponse(
                JSON.stringify({
                    success: false,
                    message: '获取卡密链接失败',
                    error: error.message,
                    stack: error.stack
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
    } catch (error: any) {
        console.error('测试卡密链接时发生错误:', error);
        return new NextResponse(
            JSON.stringify({
                success: false,
                message: '服务器内部错误',
                error: error.message,
                stack: error.stack
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
} 