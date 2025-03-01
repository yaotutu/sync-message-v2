import { AppTemplate, TemplateRule, CreateTemplateDTO, CreateRuleDTO } from '@/types/templates';
import { randomUUID } from 'crypto';
import { sql, sqlQuery, sqlGet } from './db';

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
            SELECT id, type, mode, pattern, description, order_num as order, is_active as isActive
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
        SELECT id, type, mode, pattern, description, order_num as order, is_active as isActive
        FROM rules
        WHERE template_id = ${id}
        ORDER BY order_num
    `;

    return template;
}

// 创建新模板
export async function createTemplate(data: CreateTemplateDTO): Promise<AppTemplate> {
    const now = new Date().toISOString();
    const id = generateId();

    await sql`
        INSERT INTO templates (id, name, description, created_at, updated_at)
        VALUES (${id}, ${data.name}, ${data.description}, ${now}, ${now})
    `;

    return {
        id,
        name: data.name,
        description: data.description,
        rules: [],
        createdAt: now,
        updatedAt: now
    };
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
    if (data.mode === 'simple') {
        pattern = data.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // 转义特殊字符
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
        order: orderNum,
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

// 将简单模式的文本转换为正则表达式
export function convertSimplePatternToRegex(pattern: string): string {
    return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 测试消息是否匹配规则
export function testMessage(message: string, rule: TemplateRule): boolean {
    try {
        const pattern = rule.mode === 'simple'
            ? new RegExp(convertSimplePatternToRegex(rule.pattern))
            : new RegExp(rule.pattern);

        const isMatch = pattern.test(message);
        return rule.type === 'include' ? isMatch : !isMatch;
    } catch (e) {
        console.error('规则匹配错误:', e);
        return false;
    }
} 