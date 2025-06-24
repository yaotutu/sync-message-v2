import prisma, { transaction } from './index.js';
import { randomUUID } from 'crypto';

/**
 * 生成卡密链接的key
 * @returns {string}
 */
export function generateCardLinkKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const length = 16;
  let key = '';

  for (let i = 0; i < length; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return key;
}

/**
 * 生成卡密链接URL
 * @param {string} cardKey
 * @param {string} appName
 * @param {string|null} phone
 * @returns {string}
 */
export function generateCardLinkUrl(cardKey, appName, phone) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const params = new URLSearchParams({
    cardKey: cardKey,
    appName: appName,
  });

  if (phone) {
    params.append('phone', phone);
  }

  return `${baseUrl}/view?${params.toString()}`;
}

/**
 * 创建新的卡密链接
 * @param {string} username
 * @param {Object} data
 * @param {string} data.appName
 * @param {string} [data.phone]
 * @param {string} [data.templateId]
 * @returns {Promise<Object>}
 */
export async function createCardLink(username, data) {
  const id = randomUUID();
  const cardKey = generateCardLinkKey();
  const now = Date.now();

  const phone = data.phone || null;
  const url = generateCardLinkUrl(cardKey, data.appName, phone);

  await prisma.cardLink.create({
    data: {
      id,
      cardKey,
      username,
      appName: data.appName,
      phone,
      createdAt: now,
      url,
      templateId: data.templateId || null,
      firstUsedAt: null,
    },
  });

  return {
    id,
    cardKey,
    username,
    appName: data.appName,
    phone,
    createdAt: now,
    url,
    templateId: data.templateId,
  };
}

/**
 * 获取用户的卡密链接列表
 * @param {string} username
 * @param {number} [page=1]
 * @param {number} [pageSize=10]
 * @param {string|null} [status]
 * @returns {Promise<{links: Array<Object>, total: number}>}
 */
export async function getUserCardLinks(username, page = 1, pageSize = 10, status, search) {
  const where = { username };

  if (status === 'used') {
    where.firstUsedAt = { not: null };
  } else if (status === 'unused') {
    where.firstUsedAt = null;
  }

  if (search) {
    where.OR = [
      { cardKey: { contains: search } },
      { appName: { contains: search } },
      { url: { contains: search } },
      { phone: { contains: search } },
    ];
  }

  const [count, links] = await Promise.all([
    prisma.cardLink.count({ where }),
    prisma.cardLink.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        cardKey: true,
        username: true,
        appName: true,
        phone: true,
        createdAt: true,
        firstUsedAt: true,
        url: true,
      },
    }),
  ]);

  const processedLinks = links.map((link) => {
    console.log('原始时间数据:', {
      createdAt: link.createdAt,
      firstUsedAt: link.firstUsedAt,
      type: {
        createdAt: typeof link.createdAt,
        firstUsedAt: typeof link.firstUsedAt,
      },
    });

    return {
      id: link.id,
      cardKey: link.cardKey,
      username: link.username,
      appName: link.appName,
      phone: link.phone,
      createdAt:
        link.createdAt instanceof Date
          ? link.createdAt.toISOString()
          : typeof link.createdAt === 'number'
            ? new Date(link.createdAt).toISOString()
            : link.createdAt,
      firstUsedAt:
        link.firstUsedAt instanceof Date
          ? link.firstUsedAt.toISOString()
          : typeof link.firstUsedAt === 'number'
            ? new Date(link.firstUsedAt).toISOString()
            : link.firstUsedAt,
      url: link.url,
    };
  });

  return { links: processedLinks, total: count };
}

/**
 * 获取单个卡密链接
 * @param {string} cardKey
 * @returns {Promise<Object|null>}
 */
export async function getCardLink(cardKey) {
  const link = await prisma.cardLink.findUnique({
    where: { cardKey },
    select: {
      id: true,
      cardKey: true,
      username: true,
      appName: true,
      phone: true,
      createdAt: true,
      firstUsedAt: true,
      url: true,
      templateId: true,
    },
  });

  if (!link) {
    return null;
  }

  return {
    id: link.id,
    cardKey: link.cardKey,
    username: link.username,
    appName: link.appName,
    phone: link.phone,
    createdAt:
      link.createdAt instanceof Date
        ? link.createdAt.toISOString()
        : typeof link.createdAt === 'number'
          ? new Date(link.createdAt).toISOString()
          : link.createdAt,
    firstUsedAt:
      link.firstUsedAt instanceof Date
        ? link.firstUsedAt.toISOString()
        : typeof link.firstUsedAt === 'number'
          ? new Date(link.firstUsedAt).toISOString()
          : link.firstUsedAt,
    url: link.url,
    templateId: link.templateId,
  };
}

/**
 * 获取所有卡密链接
 * @returns {Promise<Array<Object>>}
 */
export async function getAllCardLinks() {
  const links = await prisma.cardLink.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      cardKey: true,
      username: true,
      appName: true,
      phone: true,
      createdAt: true,
      firstUsedAt: true,
      url: true,
    },
  });

  return links.map((link) => {
    return {
      id: link.id,
      cardKey: link.cardKey,
      username: link.username,
      appName: link.appName,
      phone: link.phone,
      createdAt:
        link.createdAt instanceof Date
          ? link.createdAt.toISOString()
          : typeof link.createdAt === 'number'
            ? new Date(link.createdAt).toISOString()
            : link.createdAt,
      firstUsedAt:
        link.firstUsedAt instanceof Date
          ? link.firstUsedAt.toISOString()
          : typeof link.firstUsedAt === 'number'
            ? new Date(link.firstUsedAt).toISOString()
            : link.firstUsedAt,
      url: link.url,
    };
  });
}

/**
 * 删除卡密链接
 * @param {string} username
 * @param {string} cardKey
 * @returns {Promise<boolean>}
 */
export async function deleteCardLink(username, cardKey) {
  try {
    await prisma.cardLink.delete({
      where: {
        cardKey,
        username,
      },
    });
    return true;
  } catch (error) {
    console.error('删除卡密链接失败:', error);
    return false;
  }
}
