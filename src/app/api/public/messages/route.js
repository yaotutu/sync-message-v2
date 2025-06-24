import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { processMessagesWithRules } from '@/lib/services/messageProcessor.js';


export async function GET(request) {
    const startTime = Date.now();
    console.log(`[public-messages] 开始处理请求: ${request.url}`);

    try {
        // 1. 获取和验证参数
        const { searchParams } = new URL(request.url);
        const cardKey = searchParams.get('cardKey');
        const appName = searchParams.get('appName');
        const phone = searchParams.get('phone');

        // 解码URL参数，处理中文
        const decodedCardKey = cardKey ? decodeURIComponent(cardKey) : null;
        const decodedAppName = appName ? decodeURIComponent(appName) : null;
        const decodedPhone = phone ? decodeURIComponent(phone) : null;

        console.log(`[public-messages] 原始参数 - cardKey: ${cardKey}, appName: ${appName}, phone: ${phone}`);
        console.log(`[public-messages] 解码参数 - cardKey: ${decodedCardKey}, appName: ${decodedAppName}, phone: ${decodedPhone}`);

        // 验证参数完整性
        if (!decodedCardKey || !decodedAppName || !decodedPhone) {
            console.log(`[public-messages] 参数验证失败 - 缺少必要参数`);
            return NextResponse.json(
                { success: false, error: '缺少必要参数 (cardKey, appName, phone)' },
                { status: 400, headers: { 'Content-Type': 'application/json' } },
            );
        }

        // 2. 查询卡密链接
        console.log(`[public-messages] 开始查询卡密链接`);

        // 精确查询
        const cardLink = await prisma.cardLink.findUnique({
            where: {
                cardKey: decodedCardKey,
                appName: decodedAppName,
                phone: decodedPhone
            },
            select: {
                username: true,
                firstUsedAt: true,
                templateId: true
            },
        });


        console.log(`[public-messages] 卡密链接查询成功 - username: ${cardLink.username}, templateId: ${cardLink.templateId}`);

        // 3. 处理firstUsedAt
        let firstUsedAt = cardLink.firstUsedAt;
        if (!firstUsedAt) {
            console.log(`[public-messages] firstUsedAt不存在，更新为当前时间`);
            const currentTime = Date.now();

            await prisma.cardLink.update({
                where: {
                    cardKey: decodedCardKey,
                    appName: decodedAppName,
                    phone: decodedPhone
                },
                data: { firstUsedAt: currentTime },
            });

            firstUsedAt = currentTime;
            console.log(`[public-messages] firstUsedAt已更新: ${firstUsedAt}`);
        } else {
            console.log(`[public-messages] 使用现有firstUsedAt: ${firstUsedAt}`);
        }

        // 4. 查询用户消息 - 更新字段名以适配新的表结构
        console.log(`[public-messages] 开始查询用户消息 - username: ${cardLink.username}, firstUsedAt: ${firstUsedAt}`);
        const messages = await prisma.message.findMany({
            where: {
                username: cardLink.username,
                systemReceivedAt: { gt: firstUsedAt }
            },
            orderBy: { systemReceivedAt: 'desc' },
            select: {
                id: true,
                smsContent: true,
                smsReceivedAt: true,
                systemReceivedAt: true,
                sourceType: true
            },
        });

        console.log(`[public-messages] 消息查询完成，找到 ${messages.length} 条消息`);

        // 5. 规则管道处理
        let processedMessages = messages;
        if (cardLink.templateId) {
            console.log(`[public-messages] 开始规则管道处理，模板ID: ${cardLink.templateId}`);
            processedMessages = await processMessagesWithRules(messages, cardLink.templateId);
            console.log(`[public-messages] 规则管道处理完成，剩余 ${processedMessages.length} 条消息`);
        } else {
            console.log(`[public-messages] 无模板ID，跳过规则处理`);
        }

        // 6. 获取最终结果
        const finalMessage = processedMessages.length > 0 ? processedMessages[0] : null;
        const messageContent = finalMessage ? finalMessage.smsContent : '';

        console.log(`[public-messages] 最终结果 - 消息内容长度: ${messageContent.length}`);

        // 7. 返回响应
        const response = {
            success: true,
            message: messageContent,
            firstUsedAt: firstUsedAt,
        };

        const endTime = Date.now();
        console.log(`[public-messages] 请求处理完成，耗时: ${endTime - startTime}ms`);

        return NextResponse.json(
            response,
            { headers: { 'Content-Type': 'application/json' } },
        );

    } catch (error) {
        console.error(`[public-messages] 处理请求失败:`, error);
        return NextResponse.json(
            { success: false, error: '获取消息失败' },
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
} 