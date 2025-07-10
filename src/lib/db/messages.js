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
 * @param {number} page - 页码
 * @param {number} pageSize - 每页数量
 * @param {string} [search] - 搜索内容
 * @param {string} [sourceType] - 来源类型筛选 (sms, email)
 * @returns {Promise<{messages: Array<Message>, total: number}>}
 */
export async function findUserMessages(username, page, pageSize, search, sourceType) {
  const where = { username };
  if (search) {
    where.smsContent = { contains: search };
  }
  if (sourceType) {
    where.sourceType = sourceType;
  }

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: { systemReceivedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.message.count({ where }),
  ]);

  return { messages, total };
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
    orderBy: { systemReceivedAt: 'asc' },
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
