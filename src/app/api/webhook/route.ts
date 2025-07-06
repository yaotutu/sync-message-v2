import { NextRequest, NextResponse } from 'next/server';
import MessageStorage from '@/lib/services/messageStorage';
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
 * 使用MessageStorage统一存储消息
 *
 * 请求体格式:
 * {
 *   "username": "用户名",                        // 必填，用户名
 *   "webhookKey": "webhook密钥",                 // 必填，webhook密钥
 *   "smsContent": "消息内容",                    // 必填，消息内容
 *   "sourceType": "SMS" | "EMAIL",              // 必填，消息来源类型
 *   "smsReceivedAt": "时间值",                   // 可选，短信在手机上接收的时间
 *   "timeFormat": "timestamp" | "iso",          // 可选，时间格式（提供smsReceivedAt时必填）
 *   "systemReceivedAt": 1234567890,             // 可选，系统接收时间戳（默认当前时间）
 *   "senderPhone": "13800138000",               // 可选，发件人号码
 *   "receiverCard": "主卡",                     // 可选，接收手机卡标识
 *   "sourceApp": "微信",                        // 可选，来源应用标识
 *   "rawData": "{}"                             // 可选，原始数据JSON字符串
 * }
 *
 * sourceType 说明:
 * - "SMS": 短信消息
 * - "EMAIL": 邮件消息
 *
 * timeFormat 说明:
 * - "timestamp": smsReceivedAt 为时间戳（数字或字符串）
 * - "iso": smsReceivedAt 为ISO时间字符串（如 "2025-06-24T11:22:04.808Z"）
 */
export async function POST(request: NextRequest) {
  try {
    console.log('收到webhook消息请求');

    const body = await request.json();

    // 验证认证信息
    if (!body.username || !body.webhookKey) {
      console.log('错误: 缺少认证信息');
      return NextResponse.json(
        { success: false, message: '缺少认证信息 (需要 username 和 webhookKey)' },
        { status: 400 },
      );
    }

    // 验证 webhook key
    const userResult = await getUserByUsername(body.username);
    if (!userResult.success || !userResult.data || userResult.data.webhookKey !== body.webhookKey) {
      console.log(`错误: Webhook Key 验证失败，用户: ${body.username}`);
      return NextResponse.json(
        { success: false, message: 'Webhook Key 验证失败' },
        { status: 401 },
      );
    }
    console.log(`用户验证成功: ${body.username}`);

    // 验证消息内容
    if (!body.smsContent) {
      console.log('错误: 缺少消息内容');
      return NextResponse.json(
        { success: false, message: '缺少消息内容 (smsContent)' },
        { status: 400 },
      );
    }

    // 验证消息来源类型
    if (!body.sourceType) {
      console.log('错误: 缺少消息来源类型');
      return NextResponse.json(
        { success: false, message: '缺少消息来源类型 (sourceType)' },
        { status: 400 },
      );
    }

    if (!['SMS', 'EMAIL'].includes(body.sourceType.toUpperCase())) {
      console.log(`错误: 不支持的消息来源类型: ${body.sourceType}`);
      return NextResponse.json(
        { success: false, message: '不支持的消息来源类型，只支持 SMS 或 EMAIL' },
        { status: 400 },
      );
    }

    // 验证时间格式参数
    if (body.smsReceivedAt && !body.timeFormat) {
      console.log('错误: 提供了smsReceivedAt但缺少timeFormat');
      return NextResponse.json(
        { success: false, message: '提供了smsReceivedAt时必须指定timeFormat (timestamp 或 iso)' },
        { status: 400 },
      );
    }

    const systemReceivedAt = body.systemReceivedAt || Date.now();

    // 处理smsReceivedAt，必须明确指定时间格式
    let smsReceivedAt: number;
    try {
      smsReceivedAt = body.smsReceivedAt
        ? convertToTimestamp(body.smsReceivedAt, body.timeFormat)
        : systemReceivedAt;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.log(`时间格式转换错误: ${errorMessage}`);
      return NextResponse.json({ success: false, message: errorMessage }, { status: 400 });
    }

    console.log(
      `消息内容: ${body.smsContent ? body.smsContent.substring(0, 50) + '...' : '无内容'}`,
    );
    console.log(`消息来源类型: ${body.sourceType.toUpperCase()}`);
    console.log(`短信接收时间: ${new Date(smsReceivedAt).toISOString()}`);
    console.log(`系统接收时间: ${new Date(systemReceivedAt).toISOString()}`);
    console.log(`原始smsReceivedAt: ${body.smsReceivedAt || '未提供'}`);
    console.log(`时间格式: ${body.timeFormat || '未指定'}`);
    console.log(`转换后smsReceivedAt: ${new Date(smsReceivedAt).toISOString()}`);
    console.log(`发件人: ${body.senderPhone || '未提供'}`);
    console.log(`接收卡: ${body.receiverCard || '未提供'}`);
    console.log(`来源应用: ${body.sourceApp || '未提供'}`);

    const message = await MessageStorage.storeMessage({
      username: body.username,
      smsContent: body.smsContent,
      smsReceivedAt: BigInt(smsReceivedAt),
      sourceType: body.sourceType.toUpperCase(),
      senderPhone: body.senderPhone,
      webhookKey: body.webhookKey || '',
    });

    console.log(`消息存储成功，ID: ${message.id}`);

    return NextResponse.json({
      success: true,
      message: '消息存储成功',
      data: message,
    });
  } catch (error) {
    console.error('处理webhook请求失败:', error);
    return NextResponse.json(
      { success: false, message: '处理webhook请求失败，请稍后重试' },
      { status: 500 },
    );
  }
}
