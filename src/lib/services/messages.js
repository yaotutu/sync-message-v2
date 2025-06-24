import {
  createMessage,
  findUserMessages,
  countUserMessages,
  findOldestMessageIds,
  deleteMessages,
} from '../db/messages';

/**
 * 添加消息
 * @param {string} username - 用户名
 * @param {string} smsContent - 短信内容
 * @param {number} smsReceivedAt - 短信在手机上接收的时间戳
 * @param {number} systemReceivedAt - 系统接收时间戳
 * @param {string} sourceType - 消息来源类型
 * @param {string} [senderPhone] - 发件人号码
 * @param {string} [receiverCard] - 接收手机卡标识
 * @param {string} [sourceApp] - 来源应用标识
 * @param {string} [rawData] - 原始数据JSON字符串
 * @returns {Promise<{success: boolean, message?: string}>}
 */
export async function addMessage(
  username,
  smsContent,
  smsReceivedAt,
  systemReceivedAt = Date.now(),
  sourceType,
  senderPhone = null,
  receiverCard = null,
  sourceApp = null,
  rawData = null
) {
  try {
    await createMessage({
      username,
      smsContent,
      smsReceivedAt,
      systemReceivedAt,
      sourceType,
      senderPhone,
      receiverCard,
      sourceApp,
      rawData,
      createdAt: Date.now(),
    });
    return { success: true };
  } catch (error) {
    console.error('添加消息失败:', error);
    return { success: false, message: '添加消息失败' };
  }
}

/**
 * 获取用户消息
 * @param {string} username - 用户名
 * @param {number} [page=1] - 页码
 * @param {number} [pageSize=10] - 每页数量
 * @param {string} [search] - 搜索内容
 * @returns {Promise<{success: boolean, data?: Array<Message>, total?: number, message?: string}>}
 */
export async function getUserMessages(username, page = 1, pageSize = 10, search) {
  try {
    const { messages, total } = await findUserMessages(username, page, pageSize, search);
    return { success: true, data: messages, total };
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
        orderBy: { systemReceivedAt: 'asc' },
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
      orderBy: { systemReceivedAt: 'desc' },
    });
    return { success: true, data: messages };
  } catch (error) {
    console.error('获取所有消息失败:', error);
    return { success: false, message: '获取所有消息失败' };
  }
}
