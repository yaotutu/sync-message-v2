import {
  createUserDb,
  getUserByIdDb,
  deleteUserDb,
  getAllUsersDb,
  validateUserDb,
  getUserByUsernameDb,
} from '../db/users.js';
import { randomUUID } from 'crypto';

/**
 * 创建用户
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{success: boolean, data?: {id: number, username: string, webhookKey: string}, message?: string}>}
 */
export async function createUser(username, password) {
  try {
    const webhookKey = randomUUID();
    const now = Date.now();

    const result = await createUserDb(username, password, webhookKey, now);
    if (result.error) {
      return { success: false, message: result.error };
    }
    if (!result.lastID) {
      return { success: false, message: '创建用户失败' };
    }

    return {
      success: true,
      data: {
        id: result.lastID,
        username,
        webhookKey,
      },
    };
  } catch (error) {
    console.error('创建用户失败:', error);
    return { success: false, message: '创建用户失败，请稍后重试' };
  }
}

/**
 * 获取用户
 * @param {number} userId
 * @returns {Promise<{success: boolean, data?: User, message?: string}>}
 */
export async function getUser(userId) {
  try {
    const user = await getUserByIdDb(userId);
    if (!user) {
      return { success: false, message: '用户不存在' };
    }
    return { success: true, data: user };
  } catch (error) {
    console.error('获取用户失败:', error);
    return { success: false, message: '获取用户失败，请稍后重试' };
  }
}

/**
 * 删除用户
 * @param {string} username
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function deleteUser(username) {
  try {
    const result = await deleteUserDb(username);
    return { success: true };
  } catch (error) {
    console.error('删除用户失败:', error);
    return { success: false, message: '删除用户失败，请稍后重试' };
  }
}

/**
 * 获取所有用户
 * @returns {Promise<{success: boolean, data?: User[], message?: string}>}
 */
export async function getAllUsers() {
  try {
    const users = await getAllUsersDb();
    // 将时间戳转换为ISO格式字符串
    const formattedUsers = users.map((user) => ({
      ...user,
      createdAt: new Date(Number(user.createdAt)).toISOString(),
    }));
    return { success: true, data: formattedUsers };
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return { success: false, message: '获取用户列表失败，请稍后重试' };
  }
}

/**
 * 验证用户
 * @param {string} username
 * @param {string} password
 * @returns {Promise<{success: boolean, data?: {id: number, username: string, webhookKey: string}, message?: string}>}
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
 * 根据用户名获取用户
 * @param {string} username
 * @returns {Promise<{success: boolean, data?: User, message?: string}>}
 */
export async function getUserByUsername(username) {
  try {
    const user = await getUserByUsernameDb(username);
    if (!user) {
      return { success: false, message: '用户不存在' };
    }
    return { success: true, data: user };
  } catch (error) {
    console.error('获取用户失败:', error);
    return { success: false, message: '获取用户失败，请稍后重试' };
  }
}
