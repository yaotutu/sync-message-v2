import {
  createMessage,
  findUserMessages,
  countUserMessages,
  findOldestMessageIds,
  deleteMessages,
} from '../db/messages';

/**
 * 添加消息
 * @param {string} username
 * @param {string} smsContent
 * @param {string} [recTime]
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function addMessage(username, smsContent, recTime) {
  try {
    await createMessage({
      username,
      smsContent,
      recTime,
      receivedAt: Date.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('添加消息失败:', error);
    return { success: false, message: '添加消息失败' };
  }
}

/**
 * 获取用户消息
 * @param {string} username
 * @param {number} [limit=100]
 * @returns {Promise<{success: boolean, data?: Array<Message>, message?: string}>}
 */
export async function getUserMessages(username, limit = 100) {
  try {
    const messages = await findUserMessages(username, limit);
    return { success: true, data: messages };
  } catch (error) {
    console.error('获取用户消息失败:', error);
    return { success: false, message: '获取用户消息失败' };
  }
}

/**
 * 清理旧消息(保留最近1000条)
 * @param {string} username
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function cleanupOldMessages(username) {
  try {
    const count = await prisma.message.count({
      where: { username },
    });

    if (count > 1000) {
      const toDelete = count - 1000;
      const oldestMessages = await prisma.message.findMany({
        where: { username },
        orderBy: { receivedAt: 'asc' },
        take: toDelete,
        select: { id: true },
      });

      await prisma.message.deleteMany({
        where: {
          id: { in: oldestMessages.map((m) => m.id) },
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('清理旧消息失败:', error);
    return { success: false, message: '清理旧消息失败' };
  }
}

/**
 * 获取所有消息
 * @returns {Promise<{success: boolean, data?: Array<Message>, message?: string}>}
 */
export async function getAllMessages() {
  try {
    const messages = await prisma.message.findMany({
      orderBy: { receivedAt: 'desc' },
    });
    return { success: true, data: messages };
  } catch (error) {
    console.error('获取所有消息失败:', error);
    return { success: false, message: '获取所有消息失败' };
  }
}
