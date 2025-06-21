import prisma, { transaction } from './index.js';
import { getPermanentExpiryDate } from '../utils/account.js';

/**
 * 创建用户
 * @param {string} username
 * @param {string} password
 * @param {string} webhookKey
 * @param {number} createdAt
 * @returns {Promise<{lastID?: number, changes?: number, error?: string}>}
 */
export async function createUserDb(
  username,
  password,
  webhookKey,
  createdAt,
  canManageTemplates = false,
) {
  try {
    // 先检查用户是否已存在
    const existingUser = await prisma.webhookUser.findUnique({
      where: { username },
    });

    if (existingUser) {
      return { error: '用户名已存在' };
    }

    const result = await prisma.webhookUser.create({
      data: {
        username,
        password,
        webhookKey,
        createdAt,
        canManageTemplates,
        expiryDate: getPermanentExpiryDate(), // 使用统一永久有效日期
      },
    });
    return { lastID: result.id, changes: 1 };
  } catch (error) {
    if (error.code === 'P2002') {
      return { error: '用户名已存在' };
    }
    throw error;
  }
}

/**
 * 获取用户
 * @param {number} userId
 * @returns {Promise<User | undefined>}
 */
export async function getUserByIdDb(userId) {
  return await prisma.webhookUser.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      webhookKey: true,
      createdAt: true,
      canManageTemplates: true,
      expiryDate: true,
    },
  });
}

/**
 * 删除用户
 * @param {string} username
 * @returns {Promise<{changes: number}>}
 */
export async function deleteUserDb(username) {
  return await transaction(async (prisma) => {
    // 删除用户的卡密链接
    await prisma.cardLink.deleteMany({
      where: { username },
    });

    // 删除用户的消息
    await prisma.message.deleteMany({
      where: { username },
    });

    // 删除用户的卡密
    await prisma.cardKey.deleteMany({
      where: { username },
    });

    // 删除用户
    const result = await prisma.webhookUser.deleteMany({
      where: { username },
    });

    return { changes: result.count };
  });
}

/**
 * 获取所有用户
 * @returns {Promise<User[]>}
 */
export async function getAllUsersDb() {
  return await prisma.webhookUser.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      webhookKey: true,
      createdAt: true,
      canManageTemplates: true,
      expiryDate: true,
    },
  });
}

/**
 * 验证用户
 * @param {string} username
 * @param {string} password
 * @returns {Promise<User | undefined>}
 */
export async function validateUserDb(username, password) {
  return await prisma.webhookUser.findFirst({
    where: {
      username,
      password,
    },
    select: {
      id: true,
      username: true,
      webhookKey: true,
    },
  });
}

/**
 * 更新用户信息
 * @param {string} username
 * @param {object} updates 更新字段对象
 * @returns {Promise<void>}
 */
export async function updateUserDb(username, updates) {
  await prisma.webhookUser.update({
    where: { username },
    data: updates,
  });
}

/**
 * 根据用户名获取用户
 * @param {string} username
 * @returns {Promise<User | undefined>}
 */
export async function getUserByUsernameDb(username) {
  return await prisma.webhookUser.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      webhookKey: true,
      createdAt: true,
      canManageTemplates: true,
      expiryDate: true,
    },
  });
}
