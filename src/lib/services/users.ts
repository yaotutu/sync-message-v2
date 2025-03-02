import { sql, sqlQuery, sqlGet, transaction } from '@/lib/db';
import { User } from '@/types';
import crypto from 'crypto';

/**
 * 生成Webhook密钥
 */
export function generateWebhookKey(): string {
    return crypto.randomBytes(32).toString('hex');
}

/**
 * 添加用户
 */
export async function createUser(username: string, password: string): Promise<{ success: boolean; data?: User; message?: string }> {
    try {
        const webhook_key = generateWebhookKey();
        const now = Date.now();

        return await transaction(async (db) => {
            const result = await db.run(
                'INSERT INTO webhook_users (username, password, webhook_key, created_at) VALUES (?, ?, ?, ?)',
                [username, password, webhook_key, now]
            );

            if (!result.lastID) {
                throw new Error('创建用户失败');
            }

            const user = await db.get<User>(
                'SELECT id, username, webhook_key as webhookKey, created_at as createdAt FROM webhook_users WHERE id = ?',
                [result.lastID]
            );

            if (!user) {
                throw new Error('创建用户成功但获取用户信息失败');
            }

            return { success: true, data: user };
        });
    } catch (error) {
        console.error('创建用户失败:', error);
        if (error instanceof Error && 'code' in error && error.code === 'SQLITE_CONSTRAINT') {
            return { success: false, message: '用户名已存在' };
        }
        return { success: false, message: '创建用户失败，请稍后重试' };
    }
}

/**
 * 删除用户
 */
export async function deleteUser(username: string): Promise<{ success: boolean; data?: { username: string; deleted: boolean }; message?: string }> {
    try {
        return await transaction(async (db) => {
            // 先检查用户是否存在
            const user = await db.get('SELECT id FROM webhook_users WHERE username = ?', [username]);
            if (!user) {
                return { success: false, message: '用户不存在' };
            }

            // 删除用户的卡密链接
            await db.run('DELETE FROM card_links WHERE username = ?', [username]);

            // 删除用户的消息
            await db.run('DELETE FROM messages WHERE username = ?', [username]);

            // 删除用户
            const result = await db.run('DELETE FROM webhook_users WHERE username = ?', [username]);
            const changes = result?.changes || 0;

            return {
                success: true,
                data: {
                    username,
                    deleted: changes > 0
                }
            };
        });
    } catch (error) {
        console.error('删除用户失败:', error);
        return { success: false, message: '删除用户失败，请稍后重试' };
    }
}

/**
 * 获取用户列表
 */
export async function getAllUsers(): Promise<{ success: boolean; data?: User[]; message?: string }> {
    try {
        const users = await sqlQuery<User>`
      SELECT 
        id, 
        username, 
        webhook_key as webhookKey, 
        created_at as createdAt 
      FROM webhook_users 
      ORDER BY created_at DESC
    `;
        return { success: true, data: users };
    } catch (error) {
        console.error('获取用户列表失败:', error);
        return { success: false, message: '获取用户列表失败，请稍后重试' };
    }
}

/**
 * 验证用户
 */
export async function validateUser(username: string, password: string): Promise<{ success: boolean; data?: User; message?: string }> {
    try {
        const user = await sqlGet<User>`
      SELECT 
        id, 
        username, 
        webhook_key as webhookKey 
      FROM webhook_users 
      WHERE username = ${username} AND password = ${password}
    `;

        if (!user) {
            return { success: false, message: '用户名或密码错误' };
        }

        return { success: true, data: user };
    } catch (error) {
        console.error('验证用户失败:', error);
        return { success: false, message: '验证用户失败，请稍后重试' };
    }
}

/**
 * 获取单个用户
 */
export async function getUserByUsername(username: string): Promise<{ success: boolean; data?: User; message?: string }> {
    try {
        const user = await sqlGet<User>`
      SELECT 
        id, 
        username, 
        webhook_key as webhookKey, 
        created_at as createdAt 
      FROM webhook_users 
      WHERE username = ${username}
    `;

        if (!user) {
            return { success: false, message: '用户不存在' };
        }

        return { success: true, data: user };
    } catch (error) {
        console.error('获取用户信息失败:', error);
        return { success: false, message: '获取用户信息失败，请稍后重试' };
    }
}