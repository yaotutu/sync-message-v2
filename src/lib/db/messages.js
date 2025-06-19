import prisma from './index';

/**
 * 添加消息
 * @param {object} data - 消息数据
 * @returns {Promise<Message>}
 */
export async function createMessage(data) {
  return prisma.message.create({ data });
}

/**
 * 获取用户消息
 * @param {string} username - 用户名
 * @param {number} limit - 数量限制
 * @returns {Promise<Array<Message>>}
 */
export async function findUserMessages(username, limit) {
  return prisma.message.findMany({
    where: { username },
    orderBy: { receivedAt: 'desc' },
    take: limit,
  });
}

/**
 * 统计用户消息数量
 * @param {string} username - 用户名
 * @returns {Promise<number>}
 */
export async function countUserMessages(username) {
  return prisma.message.count({ where: { username } });
}

/**
 * 获取最早的消息ID
 * @param {string} username - 用户名
 * @param {number} take - 获取数量
 * @returns {Promise<Array<{id: number}>>}
 */
export async function findOldestMessageIds(username, take) {
  return prisma.message.findMany({
    where: { username },
    orderBy: { receivedAt: 'asc' },
    take,
    select: { id: true },
  });
}

/**
 * 批量删除消息
 * @param {Array<number>} ids - 消息ID数组
 * @returns {Promise<{count: number}>}
 */
export async function deleteMessages(ids) {
  return prisma.message.deleteMany({
    where: { id: { in: ids } },
  });
}
