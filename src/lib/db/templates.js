const { randomUUID } = require('crypto');
const { sql, sqlQuery, sqlGet, getDb, transaction } = require('./index');

// 获取所有模板
async function getAllTemplates() {
  const templates = await sqlQuery(`
        SELECT id, name, description, created_at as createdAt, updated_at as updatedAt
        FROM templates
        ORDER BY created_at DESC
    `);

  // 获取每个模板的规则
  for (const template of templates) {
    template.rules = await sqlQuery(
      `
            SELECT id, type, mode, pattern, description, order_num, is_active as isActive
            FROM rules
            WHERE template_id = ?
            ORDER BY order_num
        `,
      [template.id],
    );
  }

  return templates;
}

// 获取单个模板
async function getTemplateById(id) {
  const template = await sqlGet(
    `
        SELECT id, name, description, created_at as createdAt, updated_at as updatedAt
        FROM templates
        WHERE id = ?
    `,
    [id],
  );

  if (!template) return null;

  template.rules = await sqlQuery(
    `
        SELECT id, type, mode, pattern, description, order_num, is_active as isActive
        FROM rules
        WHERE template_id = ?
        ORDER BY order_num
    `,
    [id],
  );

  return template;
}

// 根据应用名称获取模板
async function getTemplateByName(name) {
  const template = await sqlGet(
    `
        SELECT 
            t.id,
            t.name,
            t.description,
            t.created_at as createdAt,
            t.updated_at as updatedAt
        FROM templates t
        WHERE t.name = ?
    `,
    [name],
  );

  if (!template) {
    return null;
  }

  // 获取模板的规则
  const rules = await sqlQuery(
    `
        SELECT 
            id,
            type,
            mode,
            pattern,
            description,
            order_num as order_num,
            is_active as isActive
        FROM rules
        WHERE template_id = ?
        ORDER BY order_num ASC
    `,
    [template.id],
  );

  return {
    ...template,
    rules,
  };
}

// 创建新模板
async function createTemplate(data) {
  const now = new Date().toISOString();
  const id = randomUUID();

  // 使用事务确保模板和规则的创建是原子的
  return await transaction(async (db) => {
    // 创建模板
    await db.run(
      'INSERT INTO templates (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [id, data.name, data.description, now, now],
    );

    const rules = [];

    // 如果提供了规则，创建规则
    if (data.rules && data.rules.length > 0) {
      for (let i = 0; i < data.rules.length; i++) {
        const rule = data.rules[i];
        const ruleId = randomUUID();
        let pattern = rule.pattern;

        await db.run(
          'INSERT INTO rules (id, template_id, type, mode, pattern, description, order_num, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [ruleId, id, rule.type, rule.mode, pattern, rule.description, i + 1, true],
        );

        rules.push({
          id: ruleId,
          type: rule.type,
          mode: rule.mode,
          pattern: pattern,
          description: rule.description,
          order_num: i + 1,
          isActive: true,
        });
      }
    }

    return {
      id,
      name: data.name,
      description: data.description,
      rules,
      createdAt: now,
      updatedAt: now,
    };
  });
}

// 删除模板
async function deleteTemplate(id) {
  try {
    await sql('DELETE FROM templates WHERE id = ?', [id]);
    return true;
  } catch (error) {
    console.error('Delete template error:', error);
    return false;
  }
}

// 添加规则
async function addRule(templateId, data) {
  const id = randomUUID();
  const orderNum = (await getRuleCount(templateId)) + 1;

  await sql(
    'INSERT INTO rules (id, template_id, type, mode, pattern, description, order_num, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, templateId, data.type, data.mode, data.pattern, data.description, orderNum, 1],
  );

  // 更新模板的更新时间
  const now = new Date().toISOString();
  await sql('UPDATE templates SET updated_at = ? WHERE id = ?', [now, templateId]);

  return {
    id,
    order_num: orderNum,
    type: data.type,
    mode: data.mode,
    pattern: data.pattern,
    description: data.description,
    isActive: true,
  };
}

// 删除规则
async function deleteRule(templateId, ruleId) {
  try {
    await sql('DELETE FROM rules WHERE template_id = ? AND id = ?', [templateId, ruleId]);

    // 重新排序剩余规则
    const rules = await sqlQuery(
      `
            SELECT id
            FROM rules
            WHERE template_id = ?
            ORDER BY order_num
        `,
      [templateId],
    );

    for (let i = 0; i < rules.length; i++) {
      await sql('UPDATE rules SET order_num = ? WHERE id = ?', [i + 1, rules[i].id]);
    }

    // 更新模板的更新时间
    const now = new Date().toISOString();
    await sql('UPDATE templates SET updated_at = ? WHERE id = ?', [now, templateId]);

    return true;
  } catch (error) {
    console.error('Delete rule error:', error);
    return false;
  }
}

// 更新模板
async function updateTemplate(id, data) {
  try {
    const now = new Date().toISOString();
    const db = await getDb();

    // 开始事务
    await db.run('BEGIN TRANSACTION');

    try {
      // 更新模板基本信息
      const updateFields = [];
      const updateValues = [];

      if (data.name !== undefined) {
        updateFields.push('name');
        updateValues.push(data.name);
      }

      if (data.description !== undefined) {
        updateFields.push('description');
        updateValues.push(data.description);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at');
        updateValues.push(now);

        const setClause = updateFields.map((field) => `${field} = ?`).join(', ');
        updateValues.push(id);

        await db.run(`UPDATE templates SET ${setClause} WHERE id = ?`, updateValues);
      }

      // 如果提供了规则，更新规则
      if (data.rules) {
        // 删除所有现有规则
        await db.run('DELETE FROM rules WHERE template_id = ?', [id]);

        // 插入新规则
        for (let i = 0; i < data.rules.length; i++) {
          const rule = data.rules[i];
          const ruleId = randomUUID();

          await db.run(
            `INSERT INTO rules (id, template_id, type, mode, pattern, description, order_num, is_active)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [ruleId, id, rule.type, rule.mode, rule.pattern, rule.description, i + 1, 1],
          );
        }
      }

      // 提交事务
      await db.run('COMMIT');

      // 获取更新后的模板
      return await getTemplateById(id);
    } catch (error) {
      // 如果出错，回滚事务
      await db.run('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Update template error:', error);
    return null;
  }
}

// 获取模板的规则数量
async function getRuleCount(templateId) {
  const result = await sqlGet('SELECT COUNT(*) as count FROM rules WHERE template_id = ?', [
    templateId,
  ]);
  return result.count;
}

module.exports = {
  getAllTemplates,
  getTemplateById,
  getTemplateByName,
  createTemplate,
  deleteTemplate,
  addRule,
  deleteRule,
  updateTemplate,
  getRuleCount,
};
