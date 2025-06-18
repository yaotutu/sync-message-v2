import crypto from 'crypto';
import {
  createUserDb,
  getUserByIdDb,
  deleteUserDb,
  getAllUsersDb,
  validateUserDb,
  getUserByUsernameDb,
} from '../db/users.js';

/**
 * 生成Webhook密钥
 * @returns {string}
 */
export function generateWebhookKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * 添加用户
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ success: boolean; data?: User; message?: string }>}
 */
export async function createUser(username, password) {
  try {
    const webhookKey = generateWebhookKey();
    const now = Date.now();

    const result = await createUserDb(username, password, webhookKey, now);
    if (!result.lastID) {
      throw new Error('创建用户失败');
    }

    const user = await getUserByIdDb(result.lastID);
    if (!user) {
      throw new Error('创建用户成功但获取用户信息失败');
    }

    return { success: true, data: user };
  } catch (error) {
    console.error('创建用户失败:', error);
    if (error.code === 'SQLITE_CONSTRAINT') {
      return { success: false, message: '用户名已存在' };
    }
    return { success: false, message: '创建用户失败，请稍后重试' };
  }
}

/**
 * 删除用户
 * @param {string} username
 * @returns {Promise<{ success: boolean; data?: { username: string; deleted: boolean }; message?: string }>}
 */
export async function deleteUser(username) {
  try {
    // 先检查用户是否存在
    const user = await getUserByUsernameDb(username);
    if (!user) {
      return { success: false, message: '用户不存在' };
    }

    const result = await deleteUserDb(username);
    return {
      success: true,
      data: {
        username,
        deleted: result.changes > 0,
      },
    };
  } catch (error) {
    console.error('删除用户失败:', error);
    return { success: false, message: '删除用户失败，请稍后重试' };
  }
}

/**
 * 获取用户列表
 * @returns {Promise<{ success: boolean; data?: User[]; message?: string }>}
 */
export async function getAllUsers() {
  try {
    const users = await getAllUsersDb();
    return { success: true, data: users };
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return { success: false, message: '获取用户列表失败，请稍后重试' };
  }
}

/**
 * 验证用户
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{ success: boolean; data?: User; message?: string }>}
 */
export async function validateUser(username, password) {
  try {
    const user = await validateUserDb(username, password);
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
 * @param {string} username
 * @returns {Promise<{ success: boolean; data?: User; message?: string }>}
 */
export async function getUserByUsername(username) {
  try {
    const user = await getUserByUsernameDb(username);
    if (!user) {
      return { success: false, message: '用户不存在' };
    }
    return { success: true, data: user };
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return { success: false, message: '获取用户信息失败，请稍后重试' };
  }
}
