import { sqlQuery, sqlGet, transaction } from './index.js';
import { randomUUID } from 'crypto';

/**
 * 获取所有模板
 */
export async function getAllTemplatesFromDb() {
  return await sqlQuery`
        SELECT 
          id,
          name,
          description,
          created_at as createdAt,
          updated_at as updatedAt
        FROM templates
        ORDER BY name ASC
    `;
}

/**
 * 获取模板规则
 */
export async function getTemplateRulesFromDb(templateId) {
  return await sqlQuery`
        SELECT 
          id,
          type,
          mode,
          pattern,
          description,
          order_num as order_num,
          is_active as isActive
        FROM rules
        WHERE template_id = ${templateId}
        ORDER BY order_num ASC
    `;
}

/**
 * 根据ID获取模板
 */
export async function getTemplateByIdFromDb(id) {
  return await sqlGet`
        SELECT 
          id,
          name,
          description,
          created_at as createdAt,
          updated_at as updatedAt
        FROM templates
        WHERE id = ${id}
    `;
}

/**
 * 根据名称获取模板
 */
export async function getTemplateByNameFromDb(name) {
  return await sqlGet`
        SELECT 
          id,
          name,
          description,
          created_at as createdAt,
          updated_at as updatedAt
        FROM templates
        WHERE name = ${name}
        ORDER BY updated_at DESC
        LIMIT 1
    `;
}

/**
 * 创建模板
 */
export async function createTemplateInDb(templateData, rules = []) {
  return await transaction(async (db) => {
    const now = new Date().toISOString();
    const templateId = randomUUID();

    // 插入模板
    await db.run(
      'INSERT INTO templates (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [templateId, templateData.name, templateData.description || '', now, now],
    );

    // 插入规则
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      const ruleId = randomUUID();
      const orderNum = i + 1;

      await db.run(
        'INSERT INTO rules (id, template_id, type, mode, pattern, description, order_num, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          ruleId,
          templateId,
          rule.type,
          rule.mode,
          rule.pattern,
          rule.description || '',
          orderNum,
          1,
        ],
      );
    }

    return {
      id: templateId,
      name: templateData.name,
      description: templateData.description || '',
      createdAt: now,
      updatedAt: now,
      rules: rules.map((rule, i) => ({
        id: randomUUID(),
        type: rule.type,
        mode: rule.mode,
        pattern: rule.pattern,
        description: rule.description || '',
        order_num: i + 1,
        isActive: true,
      })),
    };
  });
}

/**
 * 更新模板
 */
export async function updateTemplateInDb(id, templateData, rules) {
  return await transaction(async (db) => {
    const now = new Date().toISOString();
    const updates = [];
    const values = [];

    if (templateData.name) {
      updates.push('name = ?');
      values.push(templateData.name);
    }

    if (templateData.description !== undefined) {
      updates.push('description = ?');
      values.push(templateData.description);
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(id);

    if (updates.length > 1) {
      await db.run(`UPDATE templates SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    if (rules) {
      // 删除现有规则
      await db.run('DELETE FROM rules WHERE template_id = ?', [id]);

      // 添加新规则
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i];
        const ruleId = randomUUID();
        const orderNum = i + 1;

        await db.run(
          'INSERT INTO rules (id, template_id, type, mode, pattern, description, order_num, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [ruleId, id, rule.type, rule.mode, rule.pattern, rule.description || '', orderNum, 1],
        );
      }
    }

    return getTemplateByIdFromDb(id);
  });
}

/**
 * 删除模板
 */
export async function deleteTemplateFromDb(id) {
  return await transaction(async (db) => {
    const result = await db.run('DELETE FROM templates WHERE id = ?', [id]);
    return result.changes ? result.changes > 0 : false;
  });
}

/**
 * 添加规则到模板
 */
export async function addRuleToTemplateInDb(templateId, ruleData) {
  return await transaction(async (db) => {
    // 获取当前最大的order_num
    const maxOrderResult = await db.get(
      'SELECT MAX(order_num) as maxOrder FROM rules WHERE template_id = ?',
      [templateId],
    );
    const orderNum = (maxOrderResult?.maxOrder || 0) + 1;

    // 生成规则ID
    const ruleId = randomUUID();

    // 插入规则
    await db.run(
      'INSERT INTO rules (id, template_id, type, mode, pattern, description, order_num, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        ruleId,
        templateId,
        ruleData.type,
        ruleData.mode,
        ruleData.pattern,
        ruleData.description || '',
        orderNum,
        1,
      ],
    );

    // 更新模板的更新时间
    const now = new Date().toISOString();
    await db.run('UPDATE templates SET updated_at = ? WHERE id = ?', [now, templateId]);

    return {
      id: ruleId,
      type: ruleData.type,
      mode: ruleData.mode,
      pattern: ruleData.pattern,
      description: ruleData.description || '',
      order_num: orderNum,
      isActive: true,
    };
  });
}

/**
 * 删除规则
 */
export async function deleteRuleFromDb(templateId, ruleId) {
  return await transaction(async (db) => {
    const result = await db.run('DELETE FROM rules WHERE id = ? AND template_id = ?', [
      ruleId,
      templateId,
    ]);

    if (result.changes && result.changes > 0) {
      // 更新模板的更新时间
      const now = new Date().toISOString();
      await db.run('UPDATE templates SET updated_at = ? WHERE id = ?', [now, templateId]);
      return true;
    }

    return false;
  });
}
