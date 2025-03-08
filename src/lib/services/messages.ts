import { sqlQuery, sql, transaction } from '@/lib/db';
import { Message, CardLink, AppTemplate, TemplateRule } from '@/types';

/**
 * 获取用户的所有消息
 */
export async function getUserMessages(username: string): Promise<Message[]> {
    console.log(`[messages] 获取用户消息，用户名: ${username}`);

    try {
        const messages = await sqlQuery<Message>`
            SELECT 
                id,
                sms_content,
                rec_time,
                received_at
            FROM messages 
            WHERE username = ${username}
            ORDER BY received_at DESC
        `;

        console.log(`[messages] 成功获取用户 ${username} 的 ${messages.length} 条消息`);
        return messages;
    } catch (error) {
        console.error(`[messages] 获取用户消息失败:`, error);
        throw error;
    }
}

/**
 * 根据模板规则过滤消息
 */
export function filterMessagesByTemplate(
    messages: Message[],
    template: AppTemplate,
    phone?: string | null
): Message[] {
    console.log(`[messages] 开始过滤消息，模板: ${template.name}, 总消息数: ${messages.length}, 手机号: ${phone || '未指定'}`);

    try {
        // 按规则优先级排序
        const sortedRules = [...template.rules].sort((a, b) => a.order_num - b.order_num);
        console.log(`[messages] 模板规则数量: ${sortedRules.length}`);

        // 记录规则详情
        sortedRules.forEach((rule, index) => {
            console.log(`[messages] 规则 #${index + 1}: 类型=${rule.type}, 模式=${rule.mode}, 模式内容="${rule.pattern}"`);
        });

        const filteredMessages = messages.filter(message => {
            console.log(`[messages] 处理消息: "${message.sms_content.substring(0, 30)}..."`);

            // 如果提供了手机号，才进行手机号过滤
            if (phone) {
                if (!message.sms_content.includes(phone)) {
                    console.log(`[messages] 消息不包含指定手机号 ${phone}，已排除`);
                    return false;
                }
                console.log(`[messages] 消息包含指定手机号 ${phone}`);
            }

            // 应用模板规则过滤
            for (const rule of sortedRules) {
                const result = applyRuleToMessage(message, rule);
                console.log(`[messages] 应用规则 (${rule.type}/${rule.pattern}) 到消息，结果: ${result}`);

                // 如果规则匹配失败,直接返回false
                if (!result) {
                    console.log(`[messages] 消息被规则排除: ${rule.description || rule.pattern}`);
                    return false;
                }
            }

            console.log(`[messages] 消息通过所有规则，将被包含`);
            return true;
        });

        // 按时间倒序排序，确保最新的消息在前面
        const sortedMessages = filteredMessages.sort((a, b) => {
            const timeA = a.received_at || (a.rec_time ? new Date(a.rec_time).getTime() : 0);
            const timeB = b.received_at || (b.rec_time ? new Date(b.rec_time).getTime() : 0);
            return timeB - timeA;
        });

        console.log(`[messages] 过滤后消息数量: ${sortedMessages.length}`);
        return sortedMessages;
    } catch (error) {
        console.error(`[messages] 过滤消息失败:`, error);
        return [];
    }
}

/**
 * 应用单个规则到消息
 */
function applyRuleToMessage(message: Message, rule: TemplateRule): boolean {
    console.log(`[messages] 应用规则到消息: 规则类型=${rule.type}, 模式=${rule.pattern}`);
    console.log(`[messages] 消息内容: "${message.sms_content.substring(0, 50)}${message.sms_content.length > 50 ? '...' : ''}"`);

    try {
        // 创建正则表达式
        const pattern = createPatternFromRule(rule);
        console.log(`[messages] 规则模式: ${pattern.toString()}`);

        // 测试消息内容
        const matches = pattern.test(message.sms_content);
        console.log(`[messages] 正则匹配结果: ${matches}`);

        // 根据规则类型返回结果
        let result: boolean;
        if (rule.type === 'exclude') {
            result = !matches; // 排除规则: 如果匹配则排除(返回false)
            console.log(`[messages] 排除规则: 匹配=${matches}, 结果=${result}`);
        } else {
            result = matches; // 包含规则: 如果匹配则包含(返回true)
            console.log(`[messages] 包含规则: 匹配=${matches}, 结果=${result}`);
        }

        return result;
    } catch (error) {
        console.error(`[messages] 应用规则失败:`, error);
        // 如果规则应用失败，默认包含消息
        return true;
    }
}

/**
 * 根据规则创建正则表达式
 */
function createPatternFromRule(rule: TemplateRule): RegExp {
    if (rule.mode === 'regex') {
        // 正则表达式模式
        return new RegExp(rule.pattern);
    } else {
        // 简单包含/排除模式 (不区分大小写)
        return new RegExp(escapeRegExp(rule.pattern), 'i');
    }
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 获取并过滤卡密链接的消息
 */
export async function getFilteredCardLinkMessages(
    cardLink: CardLink,
    template: AppTemplate,
    phone?: string | null
): Promise<Message[]> {
    console.log(`[messages] 获取卡密链接消息，用户: ${cardLink.username}, 应用: ${cardLink.appName}, 模板ID: ${template.id}`);
    console.log(`[messages] 卡密链接详情: ${JSON.stringify(cardLink)}`);
    console.log(`[messages] 模板详情: ${JSON.stringify(template)}`);

    try {
        // 获取用户所有消息
        const messages = await getUserMessages(cardLink.username);
        console.log(`[messages] 用户 ${cardLink.username} 的消息总数: ${messages.length}`);

        if (messages.length > 0) {
            console.log(`[messages] 消息示例: ${JSON.stringify(messages[0])}`);
        }

        // 检查手机号过滤
        if (phone) {
            console.log(`[messages] 将过滤手机号: ${phone}`);
        } else if (cardLink.phones && cardLink.phones.length > 0) {
            console.log(`[messages] 卡密链接包含 ${cardLink.phones.length} 个手机号，但API调用未指定过滤手机号`);
        }

        // 应用模板过滤
        const filteredMessages = filterMessagesByTemplate(messages, template, phone);
        console.log(`[messages] 过滤后返回 ${filteredMessages.length} 条消息`);

        if (filteredMessages.length > 0) {
            console.log(`[messages] 过滤后消息示例: ${JSON.stringify(filteredMessages[0])}`);
        }

        return filteredMessages;
    } catch (error) {
        console.error(`[messages] 获取并过滤卡密链接消息失败:`, error);
        throw error;
    }
}

/**
 * 添加消息
 */
export async function addMessage(
    username: string,
    sms_content: string,
    rec_time: string | null = null,
    received_at: number = Date.now()
): Promise<{ success: boolean; message?: string }> {
    try {
        // 插入新消息
        await sql`
            INSERT INTO messages (username, sms_content, rec_time, received_at) 
            VALUES (${username}, ${sms_content}, ${rec_time}, ${received_at})
        `;

        // 获取当前用户的消息数量
        const countResult = await sqlQuery`
            SELECT COUNT(*) as count 
            FROM messages 
            WHERE username = ${username}
        `;

        const count = countResult[0]?.count || 0;

        // 如果消息数量超过限制，删除最旧的消息
        if (count > 1000) {
            const toDelete = count - 1000;
            await sql`
                DELETE FROM messages 
                WHERE username = ${username} 
                AND id IN (
                    SELECT id FROM messages 
                    WHERE username = ${username} 
                    ORDER BY received_at ASC 
                    LIMIT ${toDelete}
                )
            `;
        }

        return { success: true };
    } catch (error) {
        console.error('添加消息失败:', error);
        return { success: false, message: '添加消息失败，请稍后重试' };
    }
} 