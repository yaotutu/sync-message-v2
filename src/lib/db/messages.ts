import { sql, sqlQuery, transaction } from './index';
import { validateCardKey } from './cards';

// 添加消息
export async function addMessage(username: string, sms_content: string, rec_time: string | null = null, received_at: number = Date.now()) {
    try {
        return await transaction(async (db) => {
            // 插入新消息
            await db.run(
                'INSERT INTO messages (username, sms_content, rec_time, received_at) VALUES (?, ?, ?, ?)',
                [username, sms_content, rec_time, received_at]
            );

            // 获取当前用户的消息数量
            const countResult = await db.get<{ count: number }>(
                'SELECT COUNT(*) as count FROM messages WHERE username = ?',
                [username]
            );

            const count = countResult?.count || 0;

            // 如果消息数量超过限制，删除最旧的消息
            if (count > 1000) {
                const toDelete = count - 1000;
                await db.run(`
                    DELETE FROM messages 
                    WHERE username = ? 
                    AND id IN (
                        SELECT id FROM messages 
                        WHERE username = ? 
                        ORDER BY received_at ASC 
                        LIMIT ?
                    )`,
                    [username, username, toDelete]
                );
            }

            return { success: true };
        });
    } catch (error) {
        console.error('Add message error:', error);
        return { success: false, message: '添加消息失败，请稍后重试' };
    }
}

// 获取消息列表
export async function getMessages(cardKey: string) {
    try {
        // 先验证卡密
        const cardKeyResult = await validateCardKey(cardKey);
        if (!cardKeyResult.success || !cardKeyResult.data) {
            return { success: false, message: cardKeyResult.message };
        }

        const messages = await sqlQuery`
            SELECT 
                id,
                username,
                sms_content,
                rec_time,
                received_at
            FROM messages 
            WHERE username = ${cardKeyResult.data.username}
            ORDER BY received_at DESC
            LIMIT 100
        `;

        return {
            success: true,
            data: messages,
            expiresIn: cardKeyResult.data.expiresIn
        };
    } catch (error) {
        console.error('Get messages error:', error);
        return { success: false, message: '获取消息失败，请稍后重试' };
    }
}

// 根据用户名获取消息
export async function getUserMessages(username: string) {
    try {
        const messages = await sqlQuery`
            SELECT 
                id,
                username,
                sms_content,
                rec_time,
                received_at
            FROM messages 
            WHERE username = ${username}
            ORDER BY received_at DESC
            LIMIT 100
        `;

        return {
            success: true,
            data: messages
        };
    } catch (error) {
        console.error('Get user messages error:', error);
        return { success: false, message: '获取用户消息失败，请稍后重试' };
    }
} 