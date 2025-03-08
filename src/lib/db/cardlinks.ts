import { sql, sqlQuery, sqlGet, transaction } from './index';
import { CardLink, CreateCardLinkDTO } from '@/types';
import { randomUUID } from 'crypto';

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
    // 如果没有设置 NEXT_PUBLIC_BASE_URL，使用默认值
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

// 生成新的卡密链接
export async function createCardLink(username: string, data: CreateCardLinkDTO): Promise<CardLink> {
    const id = randomUUID();
    const key = generateCardKey();
    const now = Date.now();

    // 处理手机号，现在是可选的
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

    // 生成URL，手机号是可选的
    const url = generateCardLinkUrl(key, data.appName, phones[0] || null);

    // 将phones数组转换为JSON字符串存储，如果没有手机号则存储null
    const phonesJson = phones.length > 0 ? JSON.stringify(phones) : null;

    await sql`
        INSERT INTO card_links (
            id, 
            key, 
            username, 
            app_name, 
            phones, 
            created_at, 
            url,
            template_id,
            first_used_at
        ) VALUES (
            ${id},
            ${key},
            ${username},
            ${data.appName},
            ${phonesJson},
            ${now},
            ${url},
            ${data.templateId || null},
            NULL
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
export async function getUserCardLinks(
    username: string,
    page: number = 1,
    pageSize: number = 10,
    status?: string | null
): Promise<{ links: CardLink[], total: number }> {
    // 根据状态构建查询条件
    let countQuery;
    let linksQuery;

    if (status === 'used') {
        // 已使用的卡密链接
        countQuery = sqlQuery`
            SELECT COUNT(*) as total
            FROM card_links
            WHERE username = ${username} AND first_used_at IS NOT NULL
        `;

        linksQuery = sqlQuery`
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
            WHERE username = ${username} AND first_used_at IS NOT NULL
            ORDER BY created_at DESC
            LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
        `;
    } else if (status === 'unused') {
        // 未使用的卡密链接
        countQuery = sqlQuery`
            SELECT COUNT(*) as total
            FROM card_links
            WHERE username = ${username} AND first_used_at IS NULL
        `;

        linksQuery = sqlQuery`
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
            WHERE username = ${username} AND first_used_at IS NULL
            ORDER BY created_at DESC
            LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
        `;
    } else {
        // 所有卡密链接
        countQuery = sqlQuery`
            SELECT COUNT(*) as total
            FROM card_links
            WHERE username = ${username}
        `;

        linksQuery = sqlQuery`
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
            LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
        `;
    }

    // 获取总数和链接列表
    const [countResult, links] = await Promise.all([countQuery, linksQuery]);
    const total = countResult[0]?.total || 0;

    // 处理每个卡密链接的phones字段
    const processedLinks = links.map(link => {
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

    return { links: processedLinks, total };
}

// 获取单个卡密链接
export async function getCardLink(key: string): Promise<CardLink | null> {
    console.log(`[db/cardlinks] 尝试获取卡密链接: ${key}`);

    try {
        // 使用 sqlGet 获取单条记录
        const link = await sqlGet`
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
            WHERE key = ${key}
        `;

        if (!link) {
            console.log(`[db/cardlinks] 未找到卡密链接: ${key}`);
            return null;
        }

        console.log(`[db/cardlinks] 找到卡密链接原始数据:`, link);

        // 如果是第一次使用（first_used_at为null），则更新first_used_at字段
        if (!link.firstUsedAt) {
            const now = Date.now();
            console.log(`[db/cardlinks] 卡密第一次被使用，更新first_used_at: ${now}`);

            await sql`
                UPDATE card_links
                SET first_used_at = ${now}
                WHERE key = ${key}
            `;

            // 更新内存中的对象
            link.firstUsedAt = now;
        } else {
            console.log(`[db/cardlinks] 卡密已被使用过，first_used_at: ${link.firstUsedAt}`);
        }

        // 处理phones字段
        let phonesArray: string[] = [];

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

        // 返回处理后的卡密链接
        const result = {
            id: link.id,
            key: link.key,
            username: link.username,
            appName: link.appName,
            phones: phonesArray,
            createdAt: link.createdAt,
            firstUsedAt: link.firstUsedAt,
            url: link.url
        };

        console.log(`[db/cardlinks] 返回处理后的卡密链接:`, result);
        return result;
    } catch (error) {
        console.error(`[db/cardlinks] 获取卡密链接失败:`, error);
        throw error;
    }
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

// 删除卡密链接
export async function deleteCardLink(username: string, key: string): Promise<boolean> {
    try {
        // 验证卡密链接属于该用户
        const result = await sql`
            DELETE FROM card_links 
            WHERE username = ${username} 
            AND key = ${key}
            AND first_used_at IS NULL
        `;

        return result.count > 0;
    } catch (error) {
        console.error('删除卡密链接失败:', error);
        return false;
    }
}