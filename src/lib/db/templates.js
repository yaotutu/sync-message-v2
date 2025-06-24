import prisma, { transaction } from './index.js';
import { randomUUID } from 'crypto';

/**
 * 获取所有模板
 */
export async function getAllTemplatesFromDb(username) {
  return await prisma.template.findMany({
    where: {
      OR: [{ isPublic: true }, { username }],
    },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      isPublic: true,
      username: true,
    },
  });
}

/**
 * 获取模板规则
 */
export async function getTemplateRulesFromDb(templateId) {
  return await prisma.rule.findMany({
    where: { templateId },
    orderBy: { orderNum: 'asc' },
    select: {
      id: true,
      mode: true,
      pattern: true,
      description: true,
      orderNum: true,
      isActive: true,
    },
  });
}

/**
 * 根据ID获取模板
 */
export async function getTemplateByIdFromDb(id) {
  return await prisma.template.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * 根据名称获取模板
 */
export async function getTemplateByNameFromDb(name) {
  return await prisma.template.findFirst({
    where: { name },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

/**
 * 创建模板
 */
export async function createTemplateInDb(templateData, rules = []) {
  return await transaction(async (prisma) => {
    const now = new Date().toISOString();
    const templateId = randomUUID();

    // 创建模板
    await prisma.template.create({
      data: {
        id: templateId,
        name: templateData.name,
        description: templateData.description || '',
        isPublic: templateData.isPublic || false,
        username: templateData.username || null,
        createdAt: now,
        updatedAt: now,
      },
    });

    // 创建规则
    if (rules.length > 0) {
      await prisma.rule.createMany({
        data: rules.map((rule, i) => ({
          id: randomUUID(),
          templateId,
          mode: rule.mode,
          pattern: rule.pattern,
          description: rule.description || '',
          orderNum: i + 1,
          isActive: true,
        })),
      });
    }

    return {
      id: templateId,
      name: templateData.name,
      description: templateData.description || '',
      createdAt: now,
      updatedAt: now,
      rules: rules.map((rule, i) => ({
        id: randomUUID(),
        mode: rule.mode,
        pattern: rule.pattern,
        description: rule.description || '',
        orderNum: i + 1,
        isActive: true,
      })),
    };
  });
}

/**
 * 更新模板
 */
export async function updateTemplateInDb(id, templateData, rules) {
  return await transaction(async (prisma) => {
    const now = new Date().toISOString();
    const updates = {};

    if (templateData.name) {
      updates.name = templateData.name;
    }

    if (templateData.description !== undefined) {
      updates.description = templateData.description;
    }

    if (templateData.isPublic !== undefined) {
      updates.isPublic = templateData.isPublic;
    }

    if (templateData.username !== undefined) {
      updates.username = templateData.username;
    }

    updates.updatedAt = now;

    // 更新模板
    await prisma.template.update({
      where: { id },
      data: updates,
    });

    if (rules) {
      // 删除现有规则
      await prisma.rule.deleteMany({
        where: { templateId: id },
      });

      // 添加新规则
      if (rules.length > 0) {
        await prisma.rule.createMany({
          data: rules.map((rule, i) => ({
            id: randomUUID(),
            templateId: id,
            mode: rule.mode,
            pattern: rule.pattern,
            description: rule.description || '',
            orderNum: i + 1,
            isActive: true,
          })),
        });
      }
    }

    return getTemplateByIdFromDb(id);
  });
}

/**
 * 删除模板
 */
export async function deleteTemplateFromDb(id, username) {
  return await transaction(async (prisma) => {
    // 先获取模板信息
    const template = await prisma.template.findUnique({
      where: { id },
      select: { username: true },
    });

    if (!template) {
      return false;
    }

    // 验证权限：模板所有者或管理员可以删除
    if (template.username && template.username !== username) {
      throw new Error('无权删除此模板');
    }

    const result = await prisma.template.delete({
      where: { id },
    });
    return !!result;
  });
}

/**
 * 添加规则到模板
 */
export async function addRuleToTemplateInDb(templateId, ruleData) {
  return await transaction(async (prisma) => {
    // 获取当前最大的order_num
    const maxOrderResult = await prisma.rule.aggregate({
      where: { templateId },
      _max: { orderNum: true },
    });
    const orderNum = (maxOrderResult._max.orderNum || 0) + 1;

    // 生成规则ID
    const ruleId = randomUUID();

    // 创建规则
    await prisma.rule.create({
      data: {
        id: ruleId,
        templateId,
        mode: ruleData.mode,
        pattern: ruleData.pattern,
        description: ruleData.description || '',
        orderNum,
        isActive: true,
      },
    });

    // 更新模板的更新时间
    const now = new Date().toISOString();
    await prisma.template.update({
      where: { id: templateId },
      data: { updatedAt: now },
    });

    return {
      id: ruleId,
      mode: ruleData.mode,
      pattern: ruleData.pattern,
      description: ruleData.description || '',
      orderNum,
      isActive: true,
    };
  });
}

/**
 * 删除规则
 */
export async function deleteRuleFromDb(templateId, ruleId) {
  return await transaction(async (prisma) => {
    const result = await prisma.rule.delete({
      where: { id: ruleId, templateId },
    });

    if (result) {
      // 更新模板的更新时间
      const now = new Date().toISOString();
      await prisma.template.update({
        where: { id: templateId },
        data: { updatedAt: now },
      });
      return true;
    }

    return false;
  });
}
