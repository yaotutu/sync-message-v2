import { sql, sqlQuery, sqlGet, transaction } from './index.js';

/**
 * 创建用户
 * @param {string} username
 * @param {string} password
 * @param {string} webhookKey
 * @param {number} createdAt
 * @returns {Promise<{lastID?: number, changes?: number}>}
 */
export async function createUserDb(username, password, webhookKey, createdAt) {
  return await sql`
    INSERT INTO webhook_users (username, password, webhook_key, created_at) 
    VALUES (${username}, ${password}, ${webhookKey}, ${createdAt})
  `;
}

/**
 * 获取用户
 * @param {number} userId
 * @returns {Promise<User | undefined>}
 */
export async function getUserByIdDb(userId) {
  return await sqlGet`
    SELECT 
      id, 
      username, 
      webhook_key as webhookKey, 
      created_at as createdAt 
    FROM webhook_users 
    WHERE id = ${userId}
  `;
}

/**
 * 删除用户
 * @param {string} username
 * @returns {Promise<{changes: number}>}
 */
export async function deleteUserDb(username) {
  // 删除用户的卡密链接
  await sql`DELETE FROM card_links WHERE username = ${username}`;

  // 删除用户的消息
  await sql`DELETE FROM messages WHERE username = ${username}`;

  // 删除用户
  return await sql`DELETE FROM webhook_users WHERE username = ${username}`;
}

/**
 * 获取所有用户
 * @returns {Promise<User[]>}
 */
export async function getAllUsersDb() {
  return await sqlQuery`
    SELECT 
      id, 
      username, 
      webhook_key as webhookKey, 
      created_at as createdAt 
    FROM webhook_users 
    ORDER BY created_at DESC
  `;
}

/**
 * 验证用户
 * @param {string} username
 * @param {string} password
 * @returns {Promise<User | undefined>}
 */
export async function validateUserDb(username, password) {
  return await sqlGet`
    SELECT 
      id, 
      username, 
      webhook_key as webhookKey 
    FROM webhook_users 
    WHERE username = ${username} AND password = ${password}
  `;
}

/**
 * 根据用户名获取用户
 * @param {string} username
 * @returns {Promise<User | undefined>}
 */
export async function getUserByUsernameDb(username) {
  return await sqlGet`
    SELECT 
      id, 
      username, 
      webhook_key as webhookKey, 
      created_at as createdAt 
    FROM webhook_users 
    WHERE username = ${username}
  `;
}
