import { PrismaClient } from '@prisma/client';

// 添加BigInt的JSON序列化支持
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// 创建Prisma客户端实例
const prisma = new PrismaClient();

// 导出Prisma客户端
export default prisma;

// 导出事务处理函数
export async function transaction(callback) {
  return await prisma.$transaction(callback);
}
