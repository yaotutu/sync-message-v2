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
 * @param {string} key
 * @param {string} appName
 * @param {string|null} phone
 * @returns {string}
 */
export function generateCardLinkUrl(key, appName, phone) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const params = new URLSearchParams({
    cardKey: key,
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
 * @param {string[]|string} [data.phones]
 * @param {string[]|string} [data.phoneNumbers]
 * @param {string} [data.templateId]
 * @returns {Promise<Object>}
 */
export async function createCardLink(username, data) {
  const id = randomUUID();
  const key = generateCardLinkKey();
  const now = Date.now();

  let phones = [];
  if (data.phones && Array.isArray(data.phones)) {
    phones = data.phones;
  } else if (data.phones && typeof data.phones === 'string') {
    phones = [data.phones];
  } else if (data.phoneNumbers && Array.isArray(data.phoneNumbers)) {
    phones = data.phoneNumbers;
  } else if (data.phoneNumbers && typeof data.phoneNumbers === 'string') {
    phones = [data.phoneNumbers];
  }

  const url = generateCardLinkUrl(key, data.appName, phones[0] || null);
  const phonesJson = phones.length > 0 ? JSON.stringify(phones) : null;

  await prisma.cardLink.create({
    data: {
      id,
      key,
      username,
      appName: data.appName,
      phones: phonesJson,
      createdAt: now,
      url,
      templateId: data.templateId || null,
      firstUsedAt: null,
    },
  });

  return {
    id,
    key,
    username,
    appName: data.appName,
    phones,
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
      { key: { contains: search } },
      { appName: { contains: search } },
      { url: { contains: search } },
      { phones: { contains: search } },
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
        key: true,
        username: true,
        appName: true,
        phones: true,
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

    let phonesArray = [];
    try {
      if (typeof link.phones === 'string') {
        try {
          phonesArray = JSON.parse(link.phones);
        } catch (parseError) {
          phonesArray = [link.phones];
        }
      } else if (Array.isArray(link.phones)) {
        phonesArray = link.phones;
      } else if (link.phones) {
        phonesArray = [String(link.phones)];
      }
    } catch (error) {
      console.error(`处理phones字段失败:`, error);
      phonesArray = [];
    }

    return {
      id: link.id,
      key: link.key,
      username: link.username,
      appName: link.appName,
      phones: phonesArray,
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
 * @param {string} key
 * @returns {Promise<Object|null>}
 */
export async function getCardLink(key) {
  console.log(`[db/cardlinks] 尝试获取卡密链接: ${key}`);

  try {
    let link = await prisma.cardLink.findUnique({
      where: { key },
      select: {
        id: true,
        key: true,
        username: true,
        appName: true,
        phones: true,
        createdAt: true,
        url: true,
        firstUsedAt: true,
      },
    });

    if (!link) {
      console.log(`[db/cardlinks] 未找到卡密链接: ${key}`);
      return null;
    }

    console.log(`[db/cardlinks] 找到卡密链接原始数据:`, link);

    if (!link.firstUsedAt) {
      const now = Date.now();
      console.log(`[db/cardlinks] 卡密第一次被使用，更新first_used_at: ${now}`);

      link = await prisma.cardLink.update({
        where: { key },
        data: { firstUsedAt: now },
        select: {
          id: true,
          key: true,
          username: true,
          appName: true,
          phones: true,
          createdAt: true,
          firstUsedAt: true,
          url: true,
        },
      });
    } else {
      console.log(`[db/cardlinks] 卡密已被使用过，first_used_at: ${link.firstUsedAt}`);
    }

    let phonesArray = [];

    if (link.phones) {
      console.log(`[db/cardlinks] 处理phones字段，类型: ${typeof link.phones}, 值:`, link.phones);
      try {
        if (typeof link.phones === 'string') {
          try {
            phonesArray = JSON.parse(link.phones);
            console.log(`[db/cardlinks] 成功解析phones字符串为数组:`, phonesArray);
          } catch (parseError) {
            console.error(`[db/cardlinks] JSON解析phones字段失败:`, parseError);
            console.log(`[db/cardlinks] 尝试将phones作为单个字符串处理`);
            phonesArray = [link.phones];
          }
        } else if (Array.isArray(link.phones)) {
          phonesArray = link.phones;
          console.log(`[db/cardlinks] phones已经是数组:`, phonesArray);
        } else {
          phonesArray = [String(link.phones)];
          console.log(`[db/cardlinks] 将phones转换为单元素数组:`, phonesArray);
        }
      } catch (error) {
        console.error(`[db/cardlinks] 处理phones字段失败:`, error);
        phonesArray = [];
      }
    } else {
      console.log(`[db/cardlinks] phones字段为空，使用空数组`);
    }

    const result = {
      id: link.id,
      key: link.key,
      username: link.username,
      appName: link.appName,
      phones: phonesArray,
      createdAt: link.createdAt,
      firstUsedAt: link.firstUsedAt,
      url: link.url,
    };

    console.log(`[db/cardlinks] 返回处理后的卡密链接:`, result);
    return result;
  } catch (error) {
    console.error(`[db/cardlinks] 获取卡密链接失败:`, error);
    throw error;
  }
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
      key: true,
      username: true,
      appName: true,
      phones: true,
      createdAt: true,
      firstUsedAt: true,
      url: true,
    },
  });

  return links.map((link) => {
    let phonesArray = [];
    try {
      if (typeof link.phones === 'string') {
        try {
          phonesArray = JSON.parse(link.phones);
        } catch (parseError) {
          phonesArray = [link.phones];
        }
      } else if (Array.isArray(link.phones)) {
        phonesArray = link.phones;
      } else if (link.phones) {
        phonesArray = [String(link.phones)];
      }
    } catch (error) {
      console.error(`处理phones字段失败:`, error);
      phonesArray = [];
    }

    return {
      id: link.id,
      key: link.key,
      username: link.username,
      appName: link.appName,
      phones: phonesArray,
      createdAt: link.createdAt,
      firstUsedAt: link.firstUsedAt,
      url: link.url,
    };
  });
}

/**
 * 删除卡密链接
 * @param {string} username
 * @param {string} key
 * @returns {Promise<boolean>}
 */
export async function deleteCardLink(username, key) {
  try {
    const result = await prisma.cardLink.deleteMany({
      where: {
        username,
        key,
        firstUsedAt: null,
      },
    });

    return result.count > 0;
  } catch (error) {
    console.error('删除卡密链接失败:', error);
    return false;
  }
}
