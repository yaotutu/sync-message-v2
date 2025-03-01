import { sql, sqlQuery, sqlGet, transaction } from './index';
import { User } from '@/types/user';
import crypto from 'crypto';

// 生成Webhook密钥
function generateWebhookKey() {
    return crypto.randomBytes(32).toString('hex');
}

// 添加用户
export async function addUser(username: string, password: string) {
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
        console.error('Add user error:', error);
        if (error instanceof Error && 'code' in error && error.code === 'SQLITE_CONSTRAINT') {
            return { success: false, message: '用户名已存在' };
        }
        return { success: false, message: '创建用户失败，请稍后重试' };
    }
}

// 删除用户
export async function deleteUser(username: string) {
    try {
        return await transaction(async (db) => {
            // 先检查用户是否存在
            const user = await db.get('SELECT id FROM webhook_users WHERE username = ?', [username]);
            if (!user) {
                return { success: false, message: '用户不存在' };
            }

            // 删除用户的卡密
            await db.run('DELETE FROM card_keys WHERE username = ?', [username]);

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
        console.error('Delete user error:', error);
        return { success: false, message: '删除用户失败，请稍后重试' };
    }
}

// 获取用户列表
export async function getUsers() {
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
        console.error('Get users error:', error);
        return { success: false, message: '获取用户列表失败，请稍后重试' };
    }
}

// 验证用户
export async function validateUser(username: string, password: string) {
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
        console.error('Validate user error:', error);
        return { success: false, message: '验证用户失败，请稍后重试' };
    }
}

// 获取单个用户
export async function getUser(username: string) {
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
        console.error('Get user error:', error);
        return { success: false, message: '获取用户信息失败，请稍后重试' };
    }
} 