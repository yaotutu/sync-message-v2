import { sql, sqlQuery, sqlGet } from '@/lib/db';
import { CardLink, CreateCardLinkDTO } from '@/types';
import { randomUUID } from 'crypto';
import { getCardLink as dbGetCardLink } from '@/lib/db/cardlinks';

/**
 * 生成卡密
 */
export function generateCardKey(): string {
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
 */
export function generateCardLinkUrl(key: string, appName: string, phone: string | null): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const params = new URLSearchParams({
    cardKey: key,
    appName: appName
  });

  if (phone) {
    params.append('phone', phone);
  }

  return `${baseUrl}/view?${params.toString()}`;
}

/**
 * 创建新的卡密链接
 */
export async function createCardLink(username: string, data: CreateCardLinkDTO): Promise<CardLink> {
  const id = randomUUID();
  const key = generateCardKey();
  const now = Date.now();
  const phones = data.phoneNumbers || [];
  const url = generateCardLinkUrl(key, data.appName, phones[0]);
  const templateId = data.templateId;

  await sql`
    INSERT INTO card_links (
      id, 
      key, 
      username, 
      app_name, 
      phones, 
      created_at, 
      url,
      template_id
    ) VALUES (
      ${id},
      ${key},
      ${username},
      ${data.appName},
      ${JSON.stringify(phones)},
      ${now},
      ${url},
      ${templateId}
    )
  `;

  return {
    id,
    key,
    username,
    appName: data.appName,
    phones: phones,
    createdAt: now,
    url,
    templateId
  };
}

/**
 * 获取用户的卡密链接列表
 */
export async function getUserCardLinks(username: string): Promise<CardLink[]> {
  const links = await sqlQuery`
    SELECT 
      id,
      key,
      username,
      app_name as appName,
      phones,
      created_at as createdAt,
      url,
      template_id as templateId
    FROM card_links
    WHERE username = ${username}
    ORDER BY created_at DESC
  `;

  // 转换数据格式以匹配CardLink接口
  return links.map(link => ({
    id: link.id,
    key: link.key,
    username: link.username,
    appName: link.appName,
    phones: JSON.parse(link.phones),
    createdAt: link.createdAt,
    url: link.url,
    templateId: link.templateId
  }));
}

/**
 * 根据卡密获取卡密链接
 */
export async function getCardLink(key: string): Promise<CardLink | null> {
  console.log(`[services/cardlinks] 尝试获取卡密链接: ${key}`);

  try {
    // 使用db/cardlinks.ts中的函数
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