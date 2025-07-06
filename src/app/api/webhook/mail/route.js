import { NextResponse } from 'next/server';
import prisma from '../../../../../src/lib/db';
import MessageStorage from '../../../../../src/lib/services/messageStorage';

// 字段映射说明 (保持与webhook接口一致)
// 使用原始请求字段名: smsReceivedAt, smsContent, senderPhone

/**
 * 邮件Webhook接口
 *
 * 请求规范：
 * - 方法: POST
 * - Content-Type: application/json
 * - 请求体:
 *   {
 *     "senderPhone": "发件人邮箱",    // 必填，对应senderPhone
 *     "smsReceivedAt": 时间戳, // 必填，毫秒级时间戳
 *     "smsContent": "邮件正文内容"  // 必填
 *   }
 *
 * 示例:
 * curl -X POST http://localhost:3000/api/webhook/mail \\
 *   -H "Content-Type: application/json" \\
 *   -d '{"senderPhone":"user@example.com","smsReceivedAt":1749105600000,"smsContent":"邮件内容"}'
 *
 * @param {Request} request
 */
export async function POST(request) {
  try {
    // 解析请求体
    // 解析请求体并映射字段
    const { senderPhone, smsReceivedAt, smsContent } = await request.json();

    if (!senderPhone) {
      return NextResponse.json({ success: false, error: '缺少发件人邮箱' }, { status: 400 });
    }

    // 查询用户表
    // 查询用户信息(包含webhookKey)
    const users = await prisma.user.findMany({
      where: {
        emails: {
          contains: senderPhone,
        },
      },
      select: {
        username: true,
        webhookKey: true,
      },
    });

    if (users.length === 0) {
      return NextResponse.json({ success: false, error: '未找到匹配用户' }, { status: 404 });
    }

    // 为所有匹配用户存储消息
    const messages = await Promise.all(
      users.map(async (user) => {
        const webhookData = {
          username: user.username,
          webhookKey: user.webhookKey,
          smsContent: smsContent,
          sourceType: 'EMAIL',
          smsReceivedAt: smsReceivedAt,
          senderPhone: senderPhone,
        };

        console.log(`为用户 ${user.username} 存储邮件消息`);
        return MessageStorage.storeMessage({
          username: webhookData.username,
          webhookKey: webhookData.webhookKey,
          smsContent: webhookData.smsContent,
          sourceType: webhookData.sourceType,
          smsReceivedAt: BigInt(webhookData.smsReceivedAt),
          senderPhone: webhookData.senderPhone,
          systemReceivedAt: BigInt(Date.now()),
        });
      }),
    );

    console.log(`邮件消息存储完成，共存储 ${messages.length} 条记录`);
    return NextResponse.json({
      success: true,
      message: `邮件消息处理成功，共存储 ${messages.length} 条记录`,
      data: messages,
    });
  } catch (error) {
    console.error('邮件webhook处理错误:', error);
    return NextResponse.json({ success: false, error: '服务器内部错误' }, { status: 500 });
  }
}
