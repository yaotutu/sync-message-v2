import { sql, sqlQuery, sqlGet, transaction } from './index';
import { CardLink, CreateCardLinkDTO } from '@/types';
import { randomUUID } from 'crypto';

// 生成新的卡密链接
export async function createCardLink(username: string, data: CreateCardLinkDTO): Promise<CardLink> {
    const id = randomUUID();
    const key = generateCardKey();
    const now = Date.now();

    // 确保phones是一个数组
    let phones: string[] = [];
    if (data.phones && Array.isArray(data.phones)) {
        phones = data.phones;
    } else if (data.phones && typeof data.phones === 'string') {
        phones = [data.phones];
    } else if (data.phoneNumbers && Array.isArray(data.phoneNumbers)) {
        phones = data.phoneNumbers;
    } else if (data.phoneNumbers && typeof data.phoneNumbers === 'string') {
        phones = [data.phoneNumbers];
    }

    // 确保至少有一个手机号
    if (phones.length === 0) {
        throw new Error('至少需要提供一个手机号');
    }

    // 生成URL，使用第一个手机号
    const url = generateCardLinkUrl(key, data.appName, phones[0]);

    // 将phones数组转换为JSON字符串存储
    const phonesJson = JSON.stringify(phones);

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
            ${phonesJson},
            ${now},
            ${url},
            ${data.templateId || null}
        )
    `;

    return {
        id,
        key,
        username,
        appName: data.appName,
        phones,
        createdAt: now,
        url,
        templateId: data.templateId
    };
}

// 获取用户的卡密链接列表
export async function getUserCardLinks(username: string): Promise<CardLink[]> {
    const links = await sqlQuery`
        SELECT 
            id,
            key,
            username,
            app_name as appName,
            phones,
            created_at as createdAt,
            first_used_at as firstUsedAt,
            url
        FROM card_links
        WHERE username = ${username}
        ORDER BY created_at DESC
    `;

    // 处理每个卡密链接的phones字段
    return links.map(link => {
        let phonesArray: string[] = [];
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
            url: link.url
        };
    });
}

// 获取单个卡密链接
export async function getCardLink(key: string): Promise<CardLink | null> {
    console.log(`[db/cardlinks] 尝试获取卡密链接: ${key}`);

    // 使用事务确保数据一致性
    return await transaction(async (db) => {
        // 获取卡密链接
        const cardLink = await db.get(`
            SELECT 
                id,
                key,
                username,
                app_name as appName,
                phones,
                created_at as createdAt,
                url,
                first_used_at as firstUsedAt
            FROM card_links
            WHERE key = ?
        `, [key]);

        if (!cardLink) {
            console.log(`[db/cardlinks] 未找到卡密链接: ${key}`);
            return null;
        }

        console.log(`[db/cardlinks] 找到卡密链接原始数据: ${JSON.stringify(cardLink)}`);
        console.log(`[db/cardlinks] phones字段类型: ${typeof cardLink.phones}, 值: ${cardLink.phones}`);

        // 如果是第一次使用（first_used_at为null），则更新first_used_at字段
        if (!cardLink.firstUsedAt) {
            const now = Date.now();
            console.log(`[db/cardlinks] 卡密第一次被使用，更新first_used_at: ${now}`);

            await db.run(`
                UPDATE card_links
                SET first_used_at = ?
                WHERE key = ?
            `, [now, key]);

            // 更新内存中的对象
            cardLink.firstUsedAt = now;
        } else {
            console.log(`[db/cardlinks] 卡密已被使用过，first_used_at: ${cardLink.firstUsedAt}`);
        }

        // 处理phones字段
        let phonesArray: string[] = [];
        try {
            if (typeof cardLink.phones === 'string') {
                try {
                    phonesArray = JSON.parse(cardLink.phones);
                    console.log(`[db/cardlinks] 成功解析phones字符串为数组: ${JSON.stringify(phonesArray)}`);
                } catch (parseError) {
                    console.error(`[db/cardlinks] JSON解析phones字段失败:`, parseError);
                    console.log(`[db/cardlinks] 尝试将phones作为单个字符串处理`);
                    phonesArray = [cardLink.phones];
                }
            } else if (Array.isArray(cardLink.phones)) {
                phonesArray = cardLink.phones;
                console.log(`[db/cardlinks] phones已经是数组: ${JSON.stringify(phonesArray)}`);
            } else if (cardLink.phones) {
                phonesArray = [String(cardLink.phones)];
                console.log(`[db/cardlinks] 将phones转换为单元素数组: ${JSON.stringify(phonesArray)}`);
            }
        } catch (error) {
            console.error(`[db/cardlinks] 处理phones字段失败:`, error);
            // 如果处理失败，使用空数组
            phonesArray = [];
        }

        // 返回处理后的卡密链接
        const result = {
            id: cardLink.id,
            key: cardLink.key,
            username: cardLink.username,
            appName: cardLink.appName,
            phones: phonesArray,
            createdAt: cardLink.createdAt,
            firstUsedAt: cardLink.firstUsedAt,
            url: cardLink.url
        };

        console.log(`[db/cardlinks] 返回处理后的卡密链接: ${JSON.stringify(result)}`);
        return result;
    });
}

// 获取所有卡密链接
export async function getAllCardLinks(): Promise<CardLink[]> {
    const links = await sqlQuery`
        SELECT 
            id,
            key,
            username,
            app_name as appName,
            phones,
            created_at as createdAt,
            first_used_at as firstUsedAt,
            url
        FROM card_links
        ORDER BY created_at DESC
    `;

    // 处理每个卡密链接的phones字段
    return links.map(link => {
        let phonesArray: string[] = [];
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
            url: link.url
        };
    });
}

// 生成卡密
function generateCardKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = 16;
    let key = '';

    for (let i = 0; i < length; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return key;
}

// 生成卡密链接URL
function generateCardLinkUrl(key: string, appName: string, phone: string | null): string {
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