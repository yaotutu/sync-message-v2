import { NextRequest, NextResponse } from 'next/server';
import { getCardLink } from '@/lib/db/cardlinks';
import { getTemplateByName } from '@/lib/services/templates';
import { getUserMessages } from '@/lib/db/messages';
import { getFilteredCardLinkMessages } from '@/lib/services/messages';

/**
 * 公共消息API - 根据卡密链接获取过滤后的消息
 */
export async function GET(request: NextRequest) {
    console.log('原始URL:', request.url);

    try {
        // 获取URL参数
        const url = new URL(request.url);
        console.log('解析后的URL:', url.toString());
        console.log('原始searchParams:', url.searchParams.toString());

        // 直接从URL获取原始参数
        const urlParts = url.toString().split('?');
        let cardKey = url.searchParams.get('cardKey');
        let rawAppName = url.searchParams.get('appName');
        let phone = url.searchParams.get('phone');

        // 如果URL中包含中文，尝试使用正则表达式直接提取参数
        if (urlParts.length > 1 && urlParts[1].includes('剪影')) {
            console.log('检测到URL中包含中文，尝试直接提取参数');

            // 提取cardKey
            const cardKeyMatch = urlParts[1].match(/cardKey=([^&]+)/);
            if (cardKeyMatch && cardKeyMatch[1]) {
                cardKey = cardKeyMatch[1];
                console.log('从URL直接提取的cardKey:', cardKey);
            }

            // 提取appName
            const appNameMatch = urlParts[1].match(/appName=([^&]+)/);
            if (appNameMatch && appNameMatch[1]) {
                rawAppName = appNameMatch[1];
                console.log('从URL直接提取的rawAppName:', rawAppName);
            }

            // 提取phone
            const phoneMatch = urlParts[1].match(/phone=([^&]+)/);
            if (phoneMatch && phoneMatch[1]) {
                phone = phoneMatch[1];
                console.log('从URL直接提取的phone:', phone);
            }
        }

        // 尝试多种方式处理appName
        let appName = rawAppName;

        // 如果appName已经是URL编码的，尝试解码
        if (rawAppName && rawAppName.includes('%')) {
            try {
                appName = decodeURIComponent(rawAppName);
                console.log('解码后的appName:', appName);
            } catch (e) {
                console.error('解码appName失败:', e);
                // 保持原样
            }
        } else if (rawAppName === '剪影') {
            // 直接使用中文名称
            appName = '剪影';
            console.log('直接使用中文名称:', appName);
        }

        console.log('最终请求参数:', {
            cardKey,
            rawAppName,
            appName,
            'appName编码': appName ? encodeURIComponent(appName) : null,
            phone
        });

        if (!cardKey) {
            console.error('缺少必要参数: cardKey');
            return NextResponse.json({ success: false, error: '缺少必要参数: cardKey' }, { status: 400 });
        }

        // 应用名称现在是可选的
        // if (!appName) {
        //     console.error('缺少必要参数: appName');
        //     return NextResponse.json({ success: false, error: '缺少必要参数: appName' }, { status: 400 });
        // }

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

            // 获取应用模板（如果提供了应用名称）
            let template = null;
            if (appName) {
                try {
                    template = await getTemplateByName(appName);
                    console.log('获取到的应用模板:', template);

                    if (!template) {
                        console.error(`未找到应用模板: ${appName}`);
                        return NextResponse.json(
                            { success: false, error: `未找到应用模板: ${appName}` },
                            { status: 404 }
                        );
                    }
                } catch (templateError: any) {
                    console.error('获取应用模板时出错:', templateError.message);
                    return NextResponse.json(
                        { success: false, error: `获取应用模板时出错: ${templateError.message}` },
                        { status: 500 }
                    );
                }
            } else {
                console.log('未提供应用名称，将返回未经应用规则过滤的消息');
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

                // 如果没有提供应用名称，则只根据手机号过滤
                if (!template) {
                    let filteredMessages = messages;

                    // 如果提供了手机号，则根据手机号过滤
                    if (phone) {
                        filteredMessages = messages.filter(msg => {
                            // 如果消息中包含手机号，则保留
                            return msg.sms_content.includes(phone);
                        });
                    }

                    console.log('未使用应用规则，仅根据手机号过滤后的消息数量:', filteredMessages.length);
                    return NextResponse.json({ success: true, data: filteredMessages });
                }

                // 过滤消息（使用应用规则）
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