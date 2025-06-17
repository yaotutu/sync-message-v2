import {
  getAllTemplatesFromDb,
  getTemplateRulesFromDb,
  getTemplateByIdFromDb,
  getTemplateByNameFromDb,
  createTemplateInDb,
  updateTemplateInDb,
  deleteTemplateFromDb,
  addRuleToTemplateInDb,
  deleteRuleFromDb,
} from '../db/templates.js';
import { randomUUID } from 'crypto';

/**
 * 生成模板ID
 */
export function generateTemplateId() {
  return randomUUID();
}

/**
 * 生成规则ID
 */
export function generateRuleId() {
  return randomUUID();
}

/**
 * 转义正则表达式特殊字符
 */
export function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 获取所有模板
 */
export async function getAllTemplates() {
  // 获取所有模板
  const templates = await getAllTemplatesFromDb();

  // 获取每个模板的规则
  for (const template of templates) {
    template.rules = await getTemplateRules(template.id);
  }

  return templates;
}

/**
 * 获取模板规则
 */
export async function getTemplateRules(templateId) {
  console.log(`[templates] 获取模板规则，模板ID: ${templateId}`);

  try {
    const rules = await getTemplateRulesFromDb(templateId);

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
export async function getTemplateById(id) {
  const template = await getTemplateByIdFromDb(id);

  if (!template) {
    return null;
  }

  template.rules = await getTemplateRules(template.id);
  return template;
}

/**
 * 根据名称获取模板
 */
export async function getTemplateByName(name) {
  console.log(`[templates] 尝试获取模板，名称: ${name}`);

  const template = await getTemplateByNameFromDb(name);

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
export async function createTemplate(data) {
  // 处理规则模式
  const processedRules =
    data.rules?.map((rule) => {
      let pattern = rule.pattern;
      if (rule.mode === 'simple_include' || rule.mode === 'simple_exclude') {
        pattern = escapeRegExp(pattern);
      }
      return { ...rule, pattern };
    }) || [];

  return await createTemplateInDb(data, processedRules);
}

/**
 * 更新模板
 */
export async function updateTemplate(id, data) {
  // 处理规则模式
  const processedRules =
    data.rules?.map((rule) => {
      let pattern = rule.pattern;
      if (rule.mode === 'simple_include' || rule.mode === 'simple_exclude') {
        pattern = escapeRegExp(pattern);
      }
      return { ...rule, pattern };
    }) || [];

  return await updateTemplateInDb(id, data, processedRules);
}

/**
 * 删除模板
 */
export async function deleteTemplate(id) {
  return await deleteTemplateFromDb(id);
}

/**
 * 添加规则到模板
 */
export async function addRule(templateId, data) {
  // 处理规则模式
  let pattern = data.pattern;
  if (data.mode === 'simple_include' || data.mode === 'simple_exclude') {
    pattern = escapeRegExp(pattern);
  }

  return await addRuleToTemplateInDb(templateId, { ...data, pattern });
}

/**
 * 删除规则
 */
export async function deleteRule(templateId, ruleId) {
  return await deleteRuleFromDb(templateId, ruleId);
}
