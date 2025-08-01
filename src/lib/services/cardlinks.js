import {
  generateCardLinkKey as dbGenerateCardLinkKey,
  generateCardLinkUrl as dbGenerateCardLinkUrl,
  createCardLink as dbCreateCardLink,
  getUserCardLinks as dbGetUserCardLinks,
  getCardLink as dbGetCardLink,
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
