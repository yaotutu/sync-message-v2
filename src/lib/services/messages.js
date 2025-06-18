import { sqlQuery, sql, transaction } from '@/lib/db';

/**
 * 获取用户的所有消息
 */
export async function getUserMessages(username) {
  try {
    const messages = await sqlQuery`
            SELECT 
                id,
                sms_content,
                rec_time,
                received_at
            FROM messages 
            WHERE username = ${username}
            ORDER BY received_at ASC
        `;
    return messages;
  } catch (error) {
    console.error(`[messages] 获取用户消息失败:`, error);
    throw error;
  }
}

/**
 * 根据模板规则过滤消息
 */
export function filterMessagesByTemplate(messages, template, phone) {
  try {
    // 按规则优先级排序
    const sortedRules = [...template.rules].sort((a, b) => a.order_num - b.order_num);

    // 过滤消息
    return messages.filter((message) => {
      // 如果提供了手机号，才进行手机号过滤
      if (phone && !message.sms_content.includes(phone)) {
        return false;
      }

      // 应用模板规则过滤
      for (const rule of sortedRules) {
        const pattern =
          rule.mode === 'regex'
            ? new RegExp(rule.pattern)
            : new RegExp(escapeRegExp(rule.pattern), 'i');

        const matches = pattern.test(message.sms_content);
        const result = rule.type === 'exclude' ? !matches : matches;

        if (!result) return false;
      }

      return true;
    });
  } catch (error) {
    console.error(`[messages] 过滤消息失败:`, error);
    return [];
  }
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 获取并过滤卡密链接的消息
 */
export async function getFilteredCardLinkMessages(cardLink, template, phone) {
  try {
    // 获取用户所有消息
    const messages = await getUserMessages(cardLink.username);

    // 应用模板过滤
    const filteredMessages = filterMessagesByTemplate(messages, template, phone);

    // 按时间升序排序
    return filteredMessages.sort((a, b) => {
      const timeA = a.received_at || (a.rec_time ? new Date(a.rec_time).getTime() : 0);
      const timeB = b.received_at || (b.rec_time ? new Date(b.rec_time).getTime() : 0);
      return timeA - timeB;
    });
  } catch (error) {
    console.error(`[messages] 获取并过滤卡密链接消息失败:`, error);
    throw error;
  }
}

/**
 * 添加消息
 */
export async function addMessage(username, sms_content, rec_time = null, received_at = Date.now()) {
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
