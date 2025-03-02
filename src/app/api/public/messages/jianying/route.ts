import { NextRequest, NextResponse } from 'next/server';
import { getCardLink } from '@/lib/db/cardlinks';
import { getTemplateByName } from '@/lib/services/templates';
import { getUserMessages } from '@/lib/db/messages';
import { getFilteredCardLinkMessages } from '@/lib/services/messages';

/**
 * 专门处理"剪影"应用的消息API
 */
export async function GET(request: NextRequest) {
    console.log('收到剪影应用消息请求');

    try {
        // 获取URL参数
        const url = new URL(request.url);
        console.log('解析后的URL:', url.toString());

        const cardKey = url.searchParams.get('cardKey');
        const phone = url.searchParams.get('phone');

        console.log('请求参数:', { cardKey, phone });

        if (!cardKey) {
            console.error('缺少必要参数: cardKey');
            return NextResponse.json({ success: false, error: '缺少必要参数: cardKey' }, { status: 400 });
        }

        // 固定应用名称为"剪影"
        const appName = '剪影';

        // 获取卡片链接
        try {
            const cardLink = await getCardLink(cardKey);
            console.log('获取到的卡片链接:', cardLink);

            if (!cardLink) {
                console.error(`未找到卡片链接: ${cardKey}`);
                return NextResponse.json({ success: false, error: `未找到卡片链接: ${cardKey}` }, { status: 404 });
            }

            // 处理phones参数
            let phones: string[] = [];
            try {
                if (phone) {
                    phones = [phone];
                } else if (cardLink.phones) {
                    phones = typeof cardLink.phones === 'string'
                        ? JSON.parse(cardLink.phones)
                        : cardLink.phones;
                }
                console.log('处理后的phones:', phones);
            } catch (phonesError: any) {
                console.error('解析phones时出错:', phonesError.message);
                return NextResponse.json(
                    { success: false, error: `解析phones时出错: ${phonesError.message}` },
                    { status: 400 }
                );
            }

            // 获取应用模板
            try {
                const template = await getTemplateByName(appName);
                console.log('获取到的应用模板:', template);

                if (!template) {
                    console.error(`未找到应用模板: ${appName}`);
                    return NextResponse.json(
                        { success: false, error: `未找到应用模板: ${appName}` },
                        { status: 404 }
                    );
                }

                // 获取用户消息
                try {
                    const messagesResult = await getUserMessages(cardLink.username);

                    if (!messagesResult.success) {
                        // 使用类型断言处理错误情况
                        const errorMessage = 'message' in messagesResult
                            ? (messagesResult as { message: string }).message
                            : '未知错误';

                        console.error(`获取用户消息失败: ${errorMessage}`);
                        return NextResponse.json(
                            { success: false, error: `获取用户消息失败: ${errorMessage}` },
                            { status: 500 }
                        );
                    }

                    // 使用类型断言处理成功情况
                    const messages = 'data' in messagesResult
                        ? (messagesResult as { data: any[] }).data
                        : [];

                    console.log(`获取到用户 ${cardLink.username} 的消息数量:`, messages.length);

                    // 过滤消息
                    try {
                        const filteredMessages = await getFilteredCardLinkMessages(cardLink, template, phone);
                        console.log('过滤后的消息数量:', filteredMessages.length);

                        return NextResponse.json({ success: true, data: filteredMessages });
                    } catch (filterError: any) {
                        console.error('过滤消息时出错:', filterError.message);
                        return NextResponse.json(
                            { success: false, error: `过滤消息时出错: ${filterError.message}` },
                            { status: 500 }
                        );
                    }
                } catch (messagesError: any) {
                    console.error('获取用户消息时出错:', messagesError.message);
                    return NextResponse.json(
                        { success: false, error: `获取用户消息时出错: ${messagesError.message}` },
                        { status: 500 }
                    );
                }
            } catch (templateError: any) {
                console.error('获取应用模板时出错:', templateError.message);
                return NextResponse.json(
                    { success: false, error: `获取应用模板时出错: ${templateError.message}` },
                    { status: 500 }
                );
            }
        } catch (cardLinkError: any) {
            console.error('获取卡片链接时出错:', cardLinkError.message);
            return NextResponse.json(
                { success: false, error: `获取卡片链接时出错: ${cardLinkError.message}` },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error('处理请求时出错:', error.message);
        return NextResponse.json(
            { success: false, error: `处理请求时出错: ${error.message}` },
            { status: 500 }
        );
    }
} 