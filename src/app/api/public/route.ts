import { NextRequest, NextResponse } from 'next/server';
import { getCardLink } from '@/lib/db/cardlinks';
import { getTemplateByName } from '@/lib/services/templates';
import { getFilteredCardLinkMessages } from '@/lib/services/messages';

/**
 * 公共API路由 - 处理所有公共API请求
 */
export async function GET(request: NextRequest) {
    try {
        console.log('收到公共API请求');

        // 获取查询参数
        const { searchParams } = new URL(request.url);
        const cardKey = searchParams.get('cardKey');
        const appName = searchParams.get('appName');
        const phone = searchParams.get('phone');

        console.log(`请求参数: cardKey=${cardKey}, appName=${appName}, phone=${phone}`);
        console.log(`请求头: ${JSON.stringify(Object.fromEntries(request.headers))}`);

        // 如果没有cardKey或appName，返回简单的成功响应
        if (!cardKey || !appName) {
            return new NextResponse(
                JSON.stringify({
                    success: true,
                    message: '公共API测试成功',
                    timestamp: new Date().toISOString()
                }),
                {
                    status: 200,
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

            // 获取应用模板
            console.log(`开始获取应用模板: ${appName}`);
            try {
                const template = await getTemplateByName(appName);
                if (!template) {
                    console.log(`错误: 找不到应用模板 ${appName}`);
                    return new NextResponse(
                        JSON.stringify({ success: false, message: '找不到应用模板' }),
                        {
                            status: 404,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                }
                console.log(`找到应用模板: ${template.name}, ID: ${template.id}, 规则数量: ${template.rules.length}`);

                // 获取过滤后的消息
                console.log(`开始获取过滤后的消息`);
                try {
                    const messages = await getFilteredCardLinkMessages(cardLink, template, phone);
                    console.log(`返回 ${messages.length} 条过滤后的消息`);

                    return new NextResponse(
                        JSON.stringify({
                            success: true,
                            data: messages
                        }),
                        {
                            status: 200,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                } catch (error: any) {
                    console.error(`获取过滤后的消息失败:`, error);
                    return new NextResponse(
                        JSON.stringify({
                            success: false,
                            message: '获取消息失败',
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
                console.error(`获取应用模板失败:`, error);
                return new NextResponse(
                    JSON.stringify({
                        success: false,
                        message: '获取应用模板失败',
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
        console.error('公共API请求失败:', error);
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