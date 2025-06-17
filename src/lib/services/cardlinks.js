import {
  generateCardKey as dbGenerateCardKey,
  generateCardLinkUrl as dbGenerateCardLinkUrl,
  createCardLink as dbCreateCardLink,
  getUserCardLinks as dbGetUserCardLinks,
  getCardLink as dbGetCardLink,
} from '../db/cardlinks.js';
import { randomUUID } from 'crypto';

/**
 * 生成卡密
 * @returns {string}
 */
export function generateCardKey() {
  return dbGenerateCardKey();
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
 * @param {string[]} [data.phoneNumbers]
 * @param {string} [data.templateId]
 * @returns {Promise<Object>}
 */
export async function createCardLink(username, data) {
  return dbCreateCardLink(username, {
    appName: data.appName,
    phoneNumbers: data.phoneNumbers,
    templateId: data.templateId,
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
