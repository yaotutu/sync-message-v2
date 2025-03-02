import {
    AppTemplate,
    CreateTemplateDTO,
    CreateRuleDTO,
    UpdateTemplateDTO,
    TemplateRule
} from '@/types';
import { randomUUID } from 'crypto';
import { sqlQuery, sqlGet, transaction } from '@/lib/db';

/**
 * 生成模板ID
 */
export function generateTemplateId(): string {
    return randomUUID();
}

/**
 * 生成规则ID
 */
export function generateRuleId(): string {
    return randomUUID();
}

/**
 * 获取所有模板
 */
export async function getAllTemplates(): Promise<AppTemplate[]> {
    // 获取所有模板
    const templates = await sqlQuery<AppTemplate>`
    SELECT 
      id,
      name,
      description,
      created_at as createdAt,
      updated_at as updatedAt
    FROM templates
    ORDER BY name ASC
  `;

    // 获取每个模板的规则
    for (const template of templates) {
        template.rules = await getTemplateRules(template.id);
    }

    return templates;
}

/**
 * 获取模板规则
 */
export async function getTemplateRules(templateId: string): Promise<TemplateRule[]> {
    console.log(`[templates] 获取模板规则，模板ID: ${templateId}`);

    try {
        const rules = await sqlQuery<TemplateRule>`
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

        console.log(`[templates] 成功获取 ${rules.length} 条规则`);

        if (rules.length > 0) {
            console.log(`[templates] 规则示例: ${JSON.stringify(rules[0])}`);
        }

        return rules;
    } catch (error) {
        console.error(`[templates] 获取模板规则失败:`, error);
        return [];
    }
}

/**
 * 根据ID获取模板
 */
export async function getTemplateById(id: string): Promise<AppTemplate | null> {
    const template = await sqlGet<AppTemplate>`
    SELECT 
      id,
      name,
      description,
      created_at as createdAt,
      updated_at as updatedAt
    FROM templates
    WHERE id = ${id}
  `;

    if (!template) {
        return null;
    }

    template.rules = await getTemplateRules(template.id);
    return template;
}

/**
 * 根据名称获取模板
 */
export async function getTemplateByName(name: string): Promise<AppTemplate | null> {
    console.log(`[templates] 尝试获取模板，名称: ${name}`);

    // 修改查询，按更新时间降序排序，获取最新的模板
    const template = await sqlGet<AppTemplate>`
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

    if (!template) {
        console.log(`[templates] 未找到模板: ${name}`);
        return null;
    }

    console.log(`[templates] 找到模板: ${template.name}, ID: ${template.id}`);

    template.rules = await getTemplateRules(template.id);
    console.log(`[templates] 获取到 ${template.rules.length} 条规则`);

    return template;
}

/**
 * 创建模板
 */
export async function createTemplate(
    data: CreateTemplateDTO & { rules?: CreateRuleDTO[] }
): Promise<AppTemplate> {
    return await transaction(async (db) => {
        const now = new Date().toISOString();
        const templateId = generateTemplateId();

        // 插入模板
        await db.run(
            'INSERT INTO templates (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            [templateId, data.name, data.description || '', now, now]
        );

        // 创建规则
        const rules: TemplateRule[] = [];
        if (data.rules && data.rules.length > 0) {
            for (let i = 0; i < data.rules.length; i++) {
                const rule = data.rules[i];
                const ruleId = generateRuleId();
                const orderNum = i + 1;

                // 处理规则模式
                let pattern = rule.pattern;
                if (rule.mode === 'simple_include' || rule.mode === 'simple_exclude') {
                    pattern = escapeRegExp(pattern);
                }

                // 插入规则
                await db.run(
                    'INSERT INTO rules (id, template_id, type, mode, pattern, description, order_num, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [ruleId, templateId, rule.type, rule.mode, pattern, rule.description || '', orderNum, 1]
                );

                rules.push({
                    id: ruleId,
                    type: rule.type,
                    mode: rule.mode,
                    pattern: rule.pattern,
                    description: rule.description || '',
                    order_num: orderNum,
                    isActive: true
                });
            }
        }

        // 返回创建的模板
        return {
            id: templateId,
            name: data.name,
            description: data.description || '',
            createdAt: now,
            updatedAt: now,
            rules
        };
    });
}

/**
 * 更新模板
 */
export async function updateTemplate(
    id: string,
    data: UpdateTemplateDTO
): Promise<AppTemplate | null> {
    return await transaction(async (db) => {
        // 检查模板是否存在
        const template = await db.get(
            'SELECT id FROM templates WHERE id = ?',
            [id]
        );

        if (!template) {
            return null;
        }

        const now = new Date().toISOString();

        // 更新模板基本信息
        if (data.name || data.description !== undefined) {
            const updates: string[] = [];
            const values: any[] = [];

            if (data.name) {
                updates.push('name = ?');
                values.push(data.name);
            }

            if (data.description !== undefined) {
                updates.push('description = ?');
                values.push(data.description);
            }

            updates.push('updated_at = ?');
            values.push(now);
            values.push(id);

            await db.run(
                `UPDATE templates SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }

        // 更新规则
        if (data.rules) {
            // 删除现有规则
            await db.run('DELETE FROM rules WHERE template_id = ?', [id]);

            // 添加新规则
            for (let i = 0; i < data.rules.length; i++) {
                const rule = data.rules[i];
                const ruleId = generateRuleId();
                const orderNum = i + 1;

                // 处理规则模式
                let pattern = rule.pattern;
                if (rule.mode === 'simple_include' || rule.mode === 'simple_exclude') {
                    pattern = escapeRegExp(pattern);
                }

                await db.run(
                    'INSERT INTO rules (id, template_id, type, mode, pattern, description, order_num, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [ruleId, id, rule.type, rule.mode, pattern, rule.description || '', orderNum, 1]
                );
            }
        }

        // 返回更新后的模板
        return await getTemplateById(id);
    });
}

/**
 * 删除模板
 */
export async function deleteTemplate(id: string): Promise<boolean> {
    return await transaction(async (db) => {
        const result = await db.run('DELETE FROM templates WHERE id = ?', [id]);
        return result.changes ? result.changes > 0 : false;
    });
}

/**
 * 转义正则表达式特殊字符
 */
export function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 添加规则到模板
 */
export async function addRule(templateId: string, data: CreateRuleDTO): Promise<TemplateRule | null> {
    return await transaction(async (db) => {
        // 检查模板是否存在
        const template = await db.get(
            'SELECT id FROM templates WHERE id = ?',
            [templateId]
        );

        if (!template) {
            return null;
        }

        // 获取当前最大的order_num
        const maxOrderResult = await db.get<{ maxOrder: number }>(
            'SELECT MAX(order_num) as maxOrder FROM rules WHERE template_id = ?',
            [templateId]
        );
        const orderNum = (maxOrderResult?.maxOrder || 0) + 1;

        // 生成规则ID
        const ruleId = generateRuleId();

        // 处理规则模式
        let pattern = data.pattern;
        if (data.mode === 'simple_include' || data.mode === 'simple_exclude') {
            pattern = escapeRegExp(pattern);
        }

        // 插入规则
        await db.run(
            'INSERT INTO rules (id, template_id, type, mode, pattern, description, order_num, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [ruleId, templateId, data.type, data.mode, pattern, data.description || '', orderNum, 1]
        );

        // 更新模板的更新时间
        const now = new Date().toISOString();
        await db.run(
            'UPDATE templates SET updated_at = ? WHERE id = ?',
            [now, templateId]
        );

        // 返回创建的规则
        return {
            id: ruleId,
            type: data.type,
            mode: data.mode,
            pattern: data.pattern,
            description: data.description || '',
            order_num: orderNum,
            isActive: true
        };
    });
}

/**
 * 删除规则
 */
export async function deleteRule(templateId: string, ruleId: string): Promise<boolean> {
    return await transaction(async (db) => {
        // 检查模板是否存在
        const template = await db.get(
            'SELECT id FROM templates WHERE id = ?',
            [templateId]
        );

        if (!template) {
            return false;
        }

        // 删除规则
        const result = await db.run(
            'DELETE FROM rules WHERE id = ? AND template_id = ?',
            [ruleId, templateId]
        );

        if (result.changes && result.changes > 0) {
            // 更新模板的更新时间
            const now = new Date().toISOString();
            await db.run(
                'UPDATE templates SET updated_at = ? WHERE id = ?',
                [now, templateId]
            );
            return true;
        }

        return false;
    });
} 