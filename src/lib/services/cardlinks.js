import {
  generateCardLinkKey as dbGenerateCardLinkKey,
  generateCardLinkUrl as dbGenerateCardLinkUrl,
  createCardLink as dbCreateCardLink,
  getUserCardLinks as dbGetUserCardLinks,
  getCardLink as dbGetCardLink,
  deleteCardLink as dbDeleteCardLink,
  deleteRecentCardLinks as dbDeleteRecentCardLinks,
  getUserByCardKey as dbGetUserByCardKey,
} from '../db/cardlinks.js';
import { randomUUID } from 'crypto';

/**
 * 生成卡密链接的key
 * @returns {string}
 */
export function generateCardLinkKey() {
  return dbGenerateCardLinkKey();
}

/**
 * 生成卡密链接URL
 * @param {string} key
 * @param {string} appName
 * @param {string|null} phone
 * @returns {string}
 */
export function generateCardLinkUrl(key, appName, phone) {
  return dbGenerateCardLinkUrl(key, appName, phone);
}

/**
 * 创建新的卡密链接
 * @param {string} username
 * @param {Object} data
 * @param {string} data.appName
 * @param {string} [data.phone]
 * @param {string} [data.templateId]
 * @param {number} [data.expiryDays]
 * @param {string[]} [data.tags]
 * @returns {Promise<{id: string, cardKey: string, username: string, appName: string, phone: string|null, createdAt: number, url: string, templateId: string|null, expiryDays: number|null, tags: string[]}>}
 */
export async function createCardLink(username, data) {
  return dbCreateCardLink(username, {
    appName: data.appName,
    phone: data.phone,
    templateId: data.templateId,
    expiryDays: data.expiryDays,
    tags: data.tags,
  });
}

/**
 * 获取用户的卡密链接列表
 * @param {string} username
 * @returns {Promise<Array<Object>>}
 */
export async function getUserCardLinks(username) {
  const { links } = await dbGetUserCardLinks(username);
  return links;
}

/**
 * 根据卡密获取卡密链接
 * @param {string} key
 * @returns {Promise<Object|null>}
 */
export async function getCardLink(key) {
  console.log(`[services/cardlinks] 尝试获取卡密链接: ${key}`);

  try {
    const cardLink = await dbGetCardLink(key);

    if (!cardLink) {
      console.log(`[services/cardlinks] 未找到卡密链接: ${key}`);
      return null;
    }

    console.log(`[services/cardlinks] 成功获取卡密链接: ${JSON.stringify(cardLink)}`);
    return cardLink;
  } catch (error) {
    console.error(`[services/cardlinks] 获取卡密链接失败:`, error);
    return null;
  }
}

/**
 * 删除卡密链接
 * @param {string} username
 * @param {string} key
 * @returns {Promise<boolean>}
 */
export async function deleteCardLink(username, key) {
  console.log(`[services/cardlinks] 尝试删除卡密链接: ${key}`);

  try {
    const result = await dbDeleteCardLink(username, key);
    if (result) {
      console.log(`[services/cardlinks] 成功删除卡密链接: ${key}`);
    } else {
      console.log(`[services/cardlinks] 删除卡密链接失败: ${key}`);
    }
    return result;
  } catch (error) {
    console.error(`[services/cardlinks] 删除卡密链接失败:`, error);
    return false;
  }
}

/**
 * 删除用户最近N条卡密链接
 * @param {string} username 用户名
 * @param {number} count 要删除的数量
 * @returns {Promise<{deletedCount: number}>}
 */
export async function deleteRecentCardLinks(username, count) {
  console.log(`[services/cardlinks] 尝试删除用户 ${username} 最近 ${count} 条卡密链接`);

  try {
    const result = await dbDeleteRecentCardLinks(username, count);
    console.log(`[services/cardlinks] 成功删除 ${result.deletedCount} 条卡密链接`);
    return result;
  } catch (error) {
    console.error(`[services/cardlinks] 删除最近卡密链接失败:`, error);
    return { deletedCount: 0 };
  }
}

/**
 * 根据卡密链接key获取用户信息
 * @param {string} cardKey
 * @returns {Promise<Object|null>}
 */
export async function getUserByCardKey(cardKey) {
  console.log(`[services/cardlinks] 尝试获取用户信息: ${cardKey}`);

  try {
    const user = await dbGetUserByCardKey(cardKey);

    if (!user) {
      console.log(`[services/cardlinks] 未找到用户信息: ${cardKey}`);
      return null;
    }

    console.log(`[services/cardlinks] 成功获取用户信息: ${JSON.stringify(user)}`);
    return user;
  } catch (error) {
    console.error(`[services/cardlinks] 获取用户信息失败:`, error);
    return null;
  }
}
