import { NextRequest, NextResponse } from 'next/server';
import { sqlQuery } from '@/lib/db';
import { verifyAdminAuth } from '@/lib/services/auth';
import { Message } from '@/types';

/**
 * 获取所有用户的消息 (管理员API)
 */
export async function GET(request: NextRequest) {
    try {
        console.log('收到管理员获取所有消息请求');

        // 验证管理员权限
        const authResult = verifyAdminAuth(request);
        if (!authResult.success) {
            console.log('错误: 管理员验证失败');
            return NextResponse.json(
                { success: false, message: '未授权访问' },
                { status: 401 }
            );
        }

        // 获取查询参数
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');
        const username = searchParams.get('username');

        console.log(`查询参数: limit=${limit}, offset=${offset}, username=${username || '未指定'}`);

        // 执行查询
        let messages: Message[] = [];

        if (username) {
            console.log(`查询特定用户的消息: ${username}`);
            // 如果指定了用户名，只获取该用户的消息
            messages = await sqlQuery<Message>`
                SELECT 
                    id,
                    username,
                    sms_content,
                    rec_time,
                    received_at
                FROM messages 
                WHERE username = ${username}
                ORDER BY received_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
            console.log(`成功获取用户 ${username} 的 ${messages.length} 条消息`);
        } else {
            console.log('查询所有用户的消息');
            // 获取所有用户的消息
            messages = await sqlQuery<Message>`
                SELECT 
                    id,
                    username,
                    sms_content,
                    rec_time,
                    received_at
                FROM messages 
                ORDER BY received_at DESC
                LIMIT ${limit} OFFSET ${offset}
            `;
            console.log(`成功获取所有用户的 ${messages.length} 条消息`);
        }

        // 获取消息的用户分布
        if (messages.length > 0 && !username) {
            const userCounts = new Map<string, number>();
            messages.forEach(msg => {
                if (msg.username) {
                    const count = userCounts.get(msg.username) || 0;
                    userCounts.set(msg.username, count + 1);
                }
            });

            console.log('消息用户分布:');
            Array.from(userCounts.entries()).forEach(([user, count]) => {
                console.log(`  - ${user}: ${count}条消息`);
            });
        }

        return NextResponse.json({
            success: true,
            data: messages,
            pagination: {
                limit,
                offset,
                total: messages.length
            }
        });
    } catch (error) {
        console.error('获取所有消息失败:', error);
        return NextResponse.json(
            { success: false, message: '获取消息失败' },
            { status: 500 }
        );
    }
} 