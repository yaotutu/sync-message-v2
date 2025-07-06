import prisma from '../db';

/**
 * 统一消息存储服务
 */
class MessageStorage {
  /**
   * 存储消息
   * @param {Object} data
   * @param {string} data.username
   * @param {string} data.webhookKey
   * @param {string} data.smsContent
   * @param {string} data.sourceType
   * @param {BigInt} data.smsReceivedAt
   * @param {string} data.senderPhone
   */
  static async storeMessage(data) {
    try {
      const message = await prisma.message.create({
        data: {
          username: data.username,
          smsContent: data.smsContent,
          smsReceivedAt: data.smsReceivedAt,
          sourceType: data.sourceType,
          senderPhone: data.senderPhone,
          systemReceivedAt: BigInt(Date.now()),
          rawData: JSON.stringify(data),
          createdAt: BigInt(Date.now()),
        },
      });

      console.log('消息存储成功:', message.id);
      return message;
    } catch (error) {
      console.error('消息存储失败:', error);
      throw new Error('消息存储失败');
    }
  }
}

export default MessageStorage;
