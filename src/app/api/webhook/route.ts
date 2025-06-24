import { NextRequest, NextResponse } from 'next/server';
import { addMessage } from '@/lib/services/messages';
import { getUserByUsername } from '@/lib/services/users';

/**
 * 转换时间格式为时间戳
 * @param {string | number} timeInput - 时间输入
 * @param {string} timeFormat - 时间格式，必须为 'timestamp' 或 'iso'
 * @returns {number} 时间戳
 */
function convertToTimestamp(timeInput: string | number, timeFormat: string): number {
    if (!timeFormat) {
        throw new Error('必须指定 timeFormat 参数');
    }

    switch (timeFormat.toLowerCase()) {
        case 'timestamp':
            // 时间戳格式
            if (typeof timeInput === 'number') {
                return timeInput;
            }
            if (typeof timeInput === 'string') {
                const timestamp = parseInt(timeInput, 10);
                if (!isNaN(timestamp)) {
                    return timestamp;
                }
            }
            throw new Error(`时间戳格式解析失败: ${timeInput}`);

        case 'iso':
            // ISO时间字符串格式
            if (typeof timeInput === 'string') {
                const date = new Date(timeInput);
                if (!isNaN(date.getTime())) {
                    return date.getTime();
                }
            }
            throw new Error(`ISO时间格式解析失败: ${timeInput}`);

        default:
            throw new Error(`不支持的时间格式: ${timeFormat}，只支持 'timestamp' 或 'iso'`);
    }
}

/**
 * Webhook API - 接收消息
 * 
 * 请求体格式:
 * {
 *   "smsContent": "消息内容",
 *   "recTime": "时间值",
 *   "timeFormat": "timestamp" | "iso",  // 必填，指定时间格式
 *   "receivedAt": 1234567890           // 可选，接收时间戳
 * }
 * 
 * timeFormat 说明:
 * - "timestamp": recTime 为时间戳（数字或字符串）
 * - "iso": recTime 为ISO时间字符串（如 "2025-06-24T11:22:04.808Z"）
 */
export async function POST(request: NextRequest) {
    try {
        console.log('收到webhook消息请求');

        const username = request.headers.get('x-username');
        const webhookKey = request.headers.get('x-webhook-key');
        const webhookType = request.headers.get('x-webhook-type');
        console.log(`请求头: username=${username}, webhookKey=${webhookKey ? '已提供' : '未提供'}, type=${webhookType}`);

        if (!username || !webhookKey || !webhookType) {
            console.log('错误: 缺少必要的请求头');
            return NextResponse.json(
                { success: false, message: '缺少必要的请求头 (需要 x-username, x-webhook-key 和 x-webhook-type)' },
                { status: 400 }
            );
        }

        // 验证消息类型
        if (!['SMS', 'EMAIL'].includes(webhookType.toUpperCase())) {
            console.log(`错误: 不支持的消息类型: ${webhookType}`);
            return NextResponse.json(
                { success: false, message: '不支持的消息类型，只支持 SMS 或 EMAIL' },
                { status: 400 }
            );
        }

        // 验证 webhook key
        const userResult = await getUserByUsername(username);
        if (!userResult.success || !userResult.data || userResult.data.webhookKey !== webhookKey) {
            console.log(`错误: Webhook Key 验证失败，用户: ${username}`);
            return NextResponse.json(
                { success: false, message: 'Webhook Key 验证失败' },
                { status: 401 }
            );
        }
        console.log(`用户验证成功: ${username}`);

        const body = await request.json();

        // 验证请求体
        if (!body.smsContent) {
            console.log('错误: 缺少消息内容');
            return NextResponse.json(
                { success: false, message: '缺少消息内容 (smsContent)' },
                { status: 400 }
            );
        }

        // 验证时间格式参数
        if (body.recTime && !body.timeFormat) {
            console.log('错误: 提供了recTime但缺少timeFormat');
            return NextResponse.json(
                { success: false, message: '提供了recTime时必须指定timeFormat (timestamp 或 iso)' },
                { status: 400 }
            );
        }

        const receivedAt = body.receivedAt || Date.now();

        // 处理recTime，必须明确指定时间格式
        let recTime: number;
        try {
            recTime = body.recTime ? convertToTimestamp(body.recTime, body.timeFormat) : receivedAt;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            console.log(`时间格式转换错误: ${errorMessage}`);
            return NextResponse.json(
                { success: false, message: errorMessage },
                { status: 400 }
            );
        }

        console.log(`消息内容: ${body.smsContent ? body.smsContent.substring(0, 50) + '...' : '无内容'}`);
        console.log(`接收时间: ${new Date(receivedAt).toISOString()}`);
        console.log(`原始recTime: ${body.recTime || '未提供'}`);
        console.log(`时间格式: ${body.timeFormat || '未指定'}`);
        console.log(`转换后recTime: ${new Date(recTime).toISOString()}`);
        console.log(`消息类型: ${webhookType.toUpperCase()}`);

        const result = await addMessage(
            username,
            body.smsContent,
            recTime,
            Number(receivedAt),
            webhookType.toUpperCase()
        );
        console.log(`消息添加结果: ${result.success ? '成功' : '失败'}, ${result.message || ''}`);

        return NextResponse.json(result);
    } catch (error) {
        console.error('处理webhook请求失败:', error);
        return NextResponse.json(
            { success: false, message: '处理webhook请求失败，请稍后重试' },
            { status: 500 }
        );
    }
}