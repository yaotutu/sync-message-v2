import { sql, sqlQuery, sqlGet } from './index';
import crypto from 'crypto';

// 生成卡密
function generateCardKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 16; // 总长度16位
  let key = '';

  for (let i = 0; i < length; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return key;
}

// 添加卡密
export async function addCardKey(username) {
  try {
    const key = generateCardKey();
    const now = Date.now();

    await sql`
            INSERT INTO card_keys (key, username, created_at)
            VALUES (${key}, ${username}, ${now})
        `;

    return {
      success: true,
      data: {
        key,
        username,
        createdAt: now,
      },
    };
  } catch (error) {
    console.error('Add card key error:', error);
    return { success: false, message: '生成卡密失败，请稍后重试' };
  }
}

// 获取用户的卡密列表
export async function getUserCardKeys(username) {
  try {
    const keys = await sqlQuery`
            SELECT 
                key,
                status,
                created_at as createdAt,
                used_at as usedAt
            FROM card_keys 
            WHERE username = ${username}
            ORDER BY created_at DESC
        `;

    return { success: true, data: keys };
  } catch (error) {
    console.error('Get user card keys error:', error);
    return { success: false, message: '获取卡密列表失败，请稍后重试' };
  }
}

// 验证卡密
export async function validateCardKey(key) {
  try {
    const cardKey = await sqlGet`
            SELECT 
                key,
                username,
                status,
                created_at as createdAt,
                used_at as usedAt
            FROM card_keys 
            WHERE key = ${key}
        `;

    if (!cardKey) {
      return { success: false, message: '卡密不存在' };
    }

    // 如果卡密未使用，标记为已使用
    if (cardKey.status === 'unused') {
      const now = Date.now();
      await sql`
                UPDATE card_keys 
                SET status = 'used', used_at = ${now}
                WHERE key = ${key}
            `;
      cardKey.status = 'used';
      cardKey.usedAt = now;
    }

    // 计算过期时间（24小时）
    const expiresIn = cardKey.usedAt ? cardKey.usedAt + 24 * 60 * 60 * 1000 - Date.now() : null;

    // 如果已过期
    if (expiresIn !== null && expiresIn <= 0) {
      return { success: false, message: '卡密已过期' };
    }

    return {
      success: true,
      data: {
        ...cardKey,
        expiresIn,
      },
    };
  } catch (error) {
    console.error('Validate card key error:', error);
    return { success: false, message: '验证卡密失败，请稍后重试' };
  }
}
