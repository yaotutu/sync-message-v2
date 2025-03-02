import { AppTemplate, TemplateRule, CreateTemplateDTO, CreateRuleDTO, UpdateTemplateDTO } from '@/types';
import { randomUUID } from 'crypto';
import { sql, sqlQuery, sqlGet, getDb, transaction } from './db';
import { Database } from 'sqlite';
import { Database as SQLiteDatabase, Statement } from 'sqlite3';

// 内存中存储模板数据
let templates: AppTemplate[] = [];

// 生成新的模板ID
const generateTemplateId = () => randomUUID();

// 生成新的规则ID
const generateRuleId = () => randomUUID();

// 生成新的ID
const generateId = () => randomUUID();

// 获取所有模板
export async function getAllTemplates(): Promise<AppTemplate[]> {
    const templates = await sqlQuery<AppTemplate>`
        SELECT id, name, description, created_at as createdAt, updated_at as updatedAt
        FROM templates
        ORDER BY created_at DESC
    `;

    // 获取每个模板的规则
    for (const template of templates) {
        template.rules = await sqlQuery<TemplateRule>`
            SELECT id, type, mode, pattern, description, order_num, is_active as isActive
            FROM rules
            WHERE template_id = ${template.id}
            ORDER BY order_num
        `;
    }

    return templates;
}

// 获取单个模板
export async function getTemplateById(id: string): Promise<AppTemplate | null> {
    const template = await sqlGet<AppTemplate>`
        SELECT id, name, description, created_at as createdAt, updated_at as updatedAt
        FROM templates
        WHERE id = ${id}
    `;

    if (!template) return null;

    template.rules = await sqlQuery<TemplateRule>`
        SELECT id, type, mode, pattern, description, order_num, is_active as isActive
        FROM rules
        WHERE template_id = ${id}
        ORDER BY order_num
    `;

    return template;
}

// 根据应用名称获取模板
export async function getTemplateByName(name: string): Promise<AppTemplate | null> {
    const template = await sqlGet<AppTemplate>`
        SELECT 
            t.id,
            t.name,
            t.description,
            t.created_at as createdAt,
            t.updated_at as updatedAt
        FROM templates t
        WHERE t.name = ${name}
    `;

    if (!template) {
        return null;
    }

    // 获取模板的规则
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
        WHERE template_id = ${template.id}
        ORDER BY order_num ASC
    `;

    return {
        ...template,
        rules
    };
}

// 创建新模板
export async function createTemplate(data: CreateTemplateDTO & { rules?: CreateRuleDTO[] }): Promise<AppTemplate> {
    const now = new Date().toISOString();
    const id = generateId();

    // 使用事务确保模板和规则的创建是原子的
    return await transaction(async (db) => {
        // 创建模板
        await db.run(
            'INSERT INTO templates (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
            [id, data.name, data.description, now, now]
        );

        const rules: TemplateRule[] = [];

        // 如果提供了规则，创建规则
        if (data.rules && data.rules.length > 0) {
            for (let i = 0; i < data.rules.length; i++) {
                const rule = data.rules[i];
                const ruleId = generateId();
                let pattern = rule.pattern;

                // 处理简单模式的规则
                if (rule.mode === 'simple_include' || rule.mode === 'simple_exclude') {
                    pattern = convertSimplePatternToRegex(rule.pattern);
                }

                await db.run(
                    'INSERT INTO rules (id, template_id, type, mode, pattern, description, order_num, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [ruleId, id, rule.type, rule.mode, pattern, rule.description, i + 1, true]
                );

                rules.push({
                    id: ruleId,
                    type: rule.type,
                    mode: rule.mode,
                    pattern: pattern,
                    description: rule.description,
                    order_num: i + 1,
                    isActive: true
                });
            }
        }

        return {
            id,
            name: data.name,
            description: data.description,
            rules,
            createdAt: now,
            updatedAt: now
        };
    });
}

// 删除模板
export async function deleteTemplate(id: string): Promise<boolean> {
    try {
        await sql`
            DELETE FROM templates
            WHERE id = ${id}
        `;
        return true;
    } catch (error) {
        console.error('Delete template error:', error);
        return false;
    }
}

// 添加规则
export async function addRule(templateId: string, data: CreateRuleDTO): Promise<TemplateRule | null> {
    // 检查模板是否存在
    const template = await getTemplateById(templateId);
    if (!template) return null;

    // 如果是简单模式，将文本转换为正则安全的模式
    let pattern = data.pattern;
    if (data.mode === 'simple_include' || data.mode === 'simple_exclude') {
        pattern = convertSimplePatternToRegex(data.pattern);
    } else {
        // 验证正则表达式是否有效
        try {
            new RegExp(pattern);
        } catch (e) {
            throw new Error('无效的正则表达式');
        }
    }

    const id = generateId();
    const orderNum = template.rules.length + 1;

    await sql`
        INSERT INTO rules (id, template_id, type, mode, pattern, description, order_num, is_active)
        VALUES (${id}, ${templateId}, ${data.type}, ${data.mode}, ${pattern}, ${data.description}, ${orderNum}, 1)
    `;

    // 更新模板的更新时间
    const now = new Date().toISOString();
    await sql`
        UPDATE templates
        SET updated_at = ${now}
        WHERE id = ${templateId}
    `;

    return {
        id,
        order_num: orderNum,
        type: data.type,
        mode: data.mode,
        pattern: pattern,
        description: data.description,
        isActive: true
    };
}

// 删除规则
export async function deleteRule(templateId: string, ruleId: string): Promise<boolean> {
    try {
        await sql`
            DELETE FROM rules
            WHERE template_id = ${templateId} AND id = ${ruleId}
        `;

        // 重新排序剩余规则
        const rules = await sqlQuery<{ id: string }>`
            SELECT id
            FROM rules
            WHERE template_id = ${templateId}
            ORDER BY order_num
        `;

        for (let i = 0; i < rules.length; i++) {
            await sql`
                UPDATE rules
                SET order_num = ${i + 1}
                WHERE id = ${rules[i].id}
            `;
        }

        // 更新模板的更新时间
        const now = new Date().toISOString();
        await sql`
            UPDATE templates
            SET updated_at = ${now}
            WHERE id = ${templateId}
        `;

        return true;
    } catch (error) {
        console.error('Delete rule error:', error);
        return false;
    }
}

// 将简单文本模式转换为正则表达式
export function convertSimplePatternToRegex(pattern: string): string {
    // 转义正则表达式特殊字符
    const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return escaped;
}

// 测试消息是否匹配规则
export function testMessage(message: string, rule: TemplateRule): boolean {
    try {
        const pattern = rule.mode === 'regex'
            ? new RegExp(rule.pattern)
            : new RegExp(rule.pattern, 'i'); // 简单模式使用不区分大小写的匹配

        const isMatch = pattern.test(message);

        // 根据规则模式确定返回结果
        if (rule.mode === 'simple_include') return isMatch;
        if (rule.mode === 'simple_exclude') return !isMatch;
        return rule.type === 'include' ? isMatch : !isMatch;
    } catch (e) {
        console.error('规则匹配错误:', e);
        return false;
    }
}

// 更新模板
export async function updateTemplate(id: string, data: UpdateTemplateDTO): Promise<AppTemplate | null> {
    try {
        const template = await getTemplateById(id);
        if (!template) return null;

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

                const setClause = updateFields.map(field => `${field} = ?`).join(', ');
                updateValues.push(id);

                await db.run(
                    `UPDATE templates SET ${setClause} WHERE id = ?`,
                    updateValues
                );
            }

            // 如果提供了规则，更新规则
            if (data.rules) {
                // 删除所有现有规则
                await db.run('DELETE FROM rules WHERE template_id = ?', [id]);

                // 插入新规则
                for (let i = 0; i < data.rules.length; i++) {
                    const rule = data.rules[i];
                    const ruleId = generateId();
                    const pattern = rule.mode === 'regex'
                        ? rule.pattern
                        : convertSimplePatternToRegex(rule.pattern);

                    await db.run(
                        `INSERT INTO rules (id, template_id, type, mode, pattern, description, order_num, is_active)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [ruleId, id, rule.type, rule.mode, pattern, rule.description, i + 1, 1]
                    );
                }
            }

            // 提交事务
            await db.run('COMMIT');

            // 获取更新后的模板
            const updatedTemplate = await getTemplateById(id);
            return updatedTemplate;
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