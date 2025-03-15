import { NextRequest, NextResponse } from 'next/server';
import { getCardLink } from '@/lib/db/cardlinks';
import { getTemplateByName } from '@/lib/services/templates';
import { getFilteredCardLinkMessages } from '@/lib/services/messages';
import { sql } from '@/lib/db';

/**
 * 公共消息API - 根据卡密链接获取过滤后的消息
 */
export async function GET(request: NextRequest) {
    try {
        // 1. 获取并验证参数
        const url = new URL(request.url);
        const cardKey = url.searchParams.get('cardKey');
        const rawAppName = url.searchParams.get('appName');
        const phone = url.searchParams.get('phone');

        // 验证必要参数
        if (!cardKey || !rawAppName) {
            return NextResponse.json(
                { success: false, error: '缺少必要参数: cardKey 或 appName' },
                { status: 400 }
            );
        }

        // 解码应用名称
        const appName = decodeURIComponent(rawAppName);

        // 2. 并行获取卡片链接和模板
        const [cardLink, template] = await Promise.all([
            getCardLink(cardKey),
            getTemplateByName(appName)
        ]);

        // 验证结果
        if (!cardLink) {
            return NextResponse.json(
                { success: false, error: `未找到卡片链接: ${cardKey}` },
                { status: 404 }
            );
        }

        if (!template) {
            return NextResponse.json(
                { success: false, error: `未找到应用模板: ${appName}` },
                { status: 404 }
            );
        }

        // 3. 获取并过滤消息（消息已按时间升序排序）
        const filteredMessages = await getFilteredCardLinkMessages(
            cardLink,
            template,
            phone || null
        );

        // 4. 处理首次使用逻辑
        let targetMessage = null;
        if (filteredMessages.length > 0) {
            if (!cardLink.firstUsedAt) {
                // 第一次使用，更新使用时间
                const now = Date.now();
                await sql`
                    UPDATE card_links 
                    SET first_used_at = ${now}
                    WHERE key = ${cardKey}
                `;
                cardLink.firstUsedAt = now;
            } else {
                // 找到首次使用时间之后的第一条消息
                // 由于消息是按时间升序排序的，这里会返回最早的符合条件的消息
                targetMessage = filteredMessages.find(msg => {
                    const msgTime = msg.received_at || (msg.rec_time ? new Date(msg.rec_time).getTime() : 0);
                    return msgTime >= cardLink.firstUsedAt!;
                });
            }
        }

        // 5. 返回结果
        return NextResponse.json({
            success: true,
            firstUsedAt: cardLink.firstUsedAt,
            message: targetMessage ? {
                content: targetMessage.sms_content,
                receivedAt: targetMessage.received_at,
                recTime: targetMessage.rec_time
            } : null
        });

    } catch (error) {
        console.error('处理消息请求失败:', error);
        return NextResponse.json(
            { success: false, error: '处理请求时出错' },
            { status: 500 }
        );
    }
} 