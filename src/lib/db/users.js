import prisma, { transaction } from './index.js';
import { getPermanentExpiryDate } from '../utils/account.js';

/**
 * 创建用户
 * @param {string} username
 * @param {string} password
 * @param {string} webhookKey
 * @param {number} createdAt
 * @param {boolean} canManageTemplates
 * @param {string[]} cardLinkTags 卡密链接标签数组
 * @param {boolean} showFooter 是否显示底部
 * @param {boolean} showAds 是否显示广告
 * @returns {Promise<{lastID?: number, changes?: number, error?: string}>}
 */
export async function createUserDb(
  username,
  password,
  webhookKey,
  createdAt,
  canManageTemplates = false,
  cardLinkTags = [],
  showFooter = true,
  showAds = true,
) {
  try {
    // 先检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return { error: '用户名已存在' };
    }

    const result = await prisma.user.create({
      data: {
        username,
        password,
        webhookKey,
        createdAt,
        canManageTemplates,
        expiryDate: getPermanentExpiryDate(), // 使用统一永久有效日期
        cardLinkTags: JSON.stringify(cardLinkTags), // 将标签数组转换为JSON字符串
        showFooter,
        showAds,
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
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      webhookKey: true,
      createdAt: true,
      canManageTemplates: true,
      expiryDate: true,
      cardLinkTags: true,
      showFooter: true,
      showAds: true,
    },
  });

  if (user) {
    // 将JSON字符串转换回数组
    user.cardLinkTags = JSON.parse(user.cardLinkTags || '[]');
  }

  return user;
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

    // 删除用户
    const result = await prisma.user.deleteMany({
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
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      username: true,
      webhookKey: true,
      createdAt: true,
      canManageTemplates: true,
      expiryDate: true,
      cardLinkTags: true,
      showFooter: true,
      showAds: true,
    },
  });

  // 将每个用户的标签JSON字符串转换回数组
  return users.map(user => ({
    ...user,
    cardLinkTags: JSON.parse(user.cardLinkTags || '[]')
  }));
}

/**
 * 验证用户
 * @param {string} username
 * @param {string} password
 * @returns {Promise<User | undefined>}
 */
export async function validateUserDb(username, password) {
  const user = await prisma.user.findFirst({
    where: {
      username,
      password,
    },
    select: {
      id: true,
      username: true,
      webhookKey: true,
      isAdmin: true,
      canManageTemplates: true,
      expiryDate: true,
      createdAt: true,
      cardLinkTags: true,
      showFooter: true,
      showAds: true,
    },
  });

  if (user) {
    // 将JSON字符串转换回数组
    user.cardLinkTags = JSON.parse(user.cardLinkTags || '[]');
  }

  return user;
}

/**
 * 更新用户信息
 * @param {string} username
 * @param {object} updates 更新字段对象
 * @returns {Promise<void>}
 */
export async function updateUserDb(username, updates) {
  // 如果更新包含cardLinkTags字段，需要转换为JSON字符串
  const dataToUpdate = { ...updates };
  if (dataToUpdate.cardLinkTags && Array.isArray(dataToUpdate.cardLinkTags)) {
    dataToUpdate.cardLinkTags = JSON.stringify(dataToUpdate.cardLinkTags);
  }

  await prisma.user.update({
    where: { username },
    data: dataToUpdate,
  });
}

/**
 * 根据用户名获取用户
 * @param {string} username
 * @returns {Promise<User | undefined>}
 */
export async function getUserByUsernameDb(username) {
  const user = await prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      webhookKey: true,
      createdAt: true,
      canManageTemplates: true,
      expiryDate: true,
      cardLinkTags: true,
      showFooter: true,
      showAds: true,
    },
  });

  if (user) {
    // 将JSON字符串转换回数组
    user.cardLinkTags = JSON.parse(user.cardLinkTags || '[]');
  }

  return user;
}
