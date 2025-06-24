import { getTemplateRules } from './templates.js';

/**
 * 应用规则过滤消息
 * @param {Array} messages - 消息列表
 * @param {Object} rule - 规则对象
 * @returns {Array} 过滤后的消息列表
 */
function applyRule(messages, rule) {
    console.log(`[messageProcessor] 应用规则: ${rule.id}, 模式: ${rule.mode}, 模式: ${rule.pattern}`);
    console.log(`[messageProcessor] 过滤前消息数量: ${messages.length}`);

    if (!rule.isActive) {
        console.log(`[messageProcessor] 规则未激活，跳过`);
        return messages;
    }

    let filteredMessages = [];

    try {
        // 根据规则模式进行过滤
        switch (rule.mode) {
            case 'simple_include':
                // 包含指定文本 - 保留包含该文本的消息
                filteredMessages = messages.filter(msg => msg.smsContent.includes(rule.pattern));
                break;

            case 'simple_exclude':
                // 排除指定文本 - 保留不包含该文本的消息
                filteredMessages = messages.filter(msg => !msg.smsContent.includes(rule.pattern));
                break;

            case 'regex':
                // 正则表达式匹配 - 保留匹配正则的消息
                try {
                    const regex = new RegExp(rule.pattern, 'i');
                    filteredMessages = messages.filter(msg => regex.test(msg.smsContent));
                } catch (error) {
                    console.error(`[messageProcessor] 正则表达式无效: ${rule.pattern}`, error);
                    return messages; // 正则无效时返回原消息
                }
                break;

            case 'regex_include':
                // 正则表达式包含 - 保留匹配正则的消息
                try {
                    const regex = new RegExp(rule.pattern, 'i');
                    filteredMessages = messages.filter(msg => regex.test(msg.smsContent));
                } catch (error) {
                    console.error(`[messageProcessor] 正则表达式无效: ${rule.pattern}`, error);
                    return messages;
                }
                break;

            case 'regex_exclude':
                // 正则表达式排除 - 保留不匹配正则的消息
                try {
                    const regex = new RegExp(rule.pattern, 'i');
                    filteredMessages = messages.filter(msg => !regex.test(msg.smsContent));
                } catch (error) {
                    console.error(`[messageProcessor] 正则表达式无效: ${rule.pattern}`, error);
                    return messages;
                }
                break;

            default:
                console.log(`[messageProcessor] 未知规则模式: ${rule.mode}，跳过`);
                return messages;
        }

        console.log(`[messageProcessor] 过滤后消息数量: ${filteredMessages.length}`);
        return filteredMessages;
    } catch (error) {
        console.error(`[messageProcessor] 应用规则失败:`, error);
        return messages; // 规则处理失败时返回原消息列表
    }
}

/**
 * 按时间过滤消息
 */
function filterByTime(messages, rule) {
    const { mode, pattern } = rule;
    const now = Date.now();

    try {
        const timeValue = parseInt(pattern);

        switch (mode) {
            case 'within_minutes':
                const minutesAgo = now - (timeValue * 60 * 1000);
                return messages.filter(msg => msg.systemReceivedAt >= minutesAgo);

            case 'within_hours':
                const hoursAgo = now - (timeValue * 60 * 60 * 1000);
                return messages.filter(msg => msg.systemReceivedAt >= hoursAgo);

            case 'within_days':
                const daysAgo = now - (timeValue * 24 * 60 * 60 * 1000);
                return messages.filter(msg => msg.systemReceivedAt >= daysAgo);

            default:
                console.log(`[messageProcessor] 未知时间过滤模式: ${mode}`);
                return messages;
        }
    } catch (error) {
        console.error(`[messageProcessor] 时间过滤失败:`, error);
        return messages;
    }
}

/**
 * 按长度过滤消息
 */
function filterByLength(messages, rule) {
    const { mode, pattern } = rule;

    try {
        const lengthValue = parseInt(pattern);

        switch (mode) {
            case 'min_length':
                return messages.filter(msg => msg.smsContent.length >= lengthValue);

            case 'max_length':
                return messages.filter(msg => msg.smsContent.length <= lengthValue);

            case 'exact_length':
                return messages.filter(msg => msg.smsContent.length === lengthValue);

            default:
                console.log(`[messageProcessor] 未知长度过滤模式: ${mode}`);
                return messages;
        }
    } catch (error) {
        console.error(`[messageProcessor] 长度过滤失败:`, error);
        return messages;
    }
}

/**
 * 规则管道处理
 * @param {Array} messages - 原始消息列表
 * @param {Array} rules - 规则列表
 * @returns {Array} 处理后的消息列表
 */
export async function processMessagesWithRules(messages, templateId) {
    console.log(`[messageProcessor] 开始规则管道处理，模板ID: ${templateId}, 原始消息数量: ${messages.length}`);

    if (!templateId) {
        console.log(`[messageProcessor] 无模板ID，跳过规则处理`);
        return messages;
    }

    try {
        // 获取模板规则
        const rules = await getTemplateRules(templateId);
        console.log(`[messageProcessor] 获取到 ${rules.length} 条规则`);

        if (rules.length === 0) {
            console.log(`[messageProcessor] 无规则，跳过处理`);
            return messages;
        }

        // 按orderNum排序规则
        const sortedRules = rules.sort((a, b) => a.orderNum - b.orderNum);
        console.log(`[messageProcessor] 规则排序完成，规则数量: ${sortedRules.length}`);

        // 管道处理
        let processedMessages = [...messages];

        for (let i = 0; i < sortedRules.length; i++) {
            const rule = sortedRules[i];
            console.log(`[messageProcessor] 处理规则 ${i + 1}/${sortedRules.length}: ${rule.id}`);

            const beforeCount = processedMessages.length;
            processedMessages = applyRule(processedMessages, rule);
            const afterCount = processedMessages.length;

            if (afterCount < beforeCount) {
                console.log(`[messageProcessor] 规则 ${rule.id} 过滤成功: ${beforeCount} -> ${afterCount}`);
            } else {
                console.log(`[messageProcessor] 规则 ${rule.id} 无匹配，跳过`);
            }

            // 如果没有消息了，提前结束
            if (processedMessages.length === 0) {
                console.log(`[messageProcessor] 所有消息已被过滤，提前结束`);
                break;
            }
        }

        console.log(`[messageProcessor] 规则管道处理完成，最终消息数量: ${processedMessages.length}`);
        return processedMessages;
    } catch (error) {
        console.error(`[messageProcessor] 规则管道处理失败:`, error);
        return messages; // 处理失败时返回原消息列表
    }
} 