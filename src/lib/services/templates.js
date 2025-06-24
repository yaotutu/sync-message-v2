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
export async function getAllTemplates(username) {
  // 获取所有模板
  const templates = await getAllTemplatesFromDb(username);

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

      // 注意：simple_include 和 simple_exclude 使用 includes() 方法，不需要正则转义
      // 只有正则表达式模式才需要特殊处理
      if (rule.mode === 'regex' || rule.mode === 'regex_include' || rule.mode === 'regex_exclude') {
        // 验证正则表达式是否有效
        try {
          new RegExp(pattern);
        } catch (error) {
          console.error(`[templates] 无效的正则表达式: ${pattern}`, error);
          throw new Error(`无效的正则表达式: ${pattern}`);
        }
      }

      return { ...rule, pattern };
    }) || [];

  // 添加创建时间
  const now = new Date().toISOString();
  const templateData = {
    ...data,
    createdAt: now,
    updatedAt: now,
  };

  return await createTemplateInDb(templateData, processedRules);
}

/**
 * 更新模板
 */
export async function updateTemplate(id, data) {
  // 处理规则模式
  const processedRules =
    data.rules?.map((rule) => {
      let pattern = rule.pattern;

      // 注意：simple_include 和 simple_exclude 使用 includes() 方法，不需要正则转义
      // 只有正则表达式模式才需要特殊处理
      if (rule.mode === 'regex' || rule.mode === 'regex_include' || rule.mode === 'regex_exclude') {
        // 验证正则表达式是否有效
        try {
          new RegExp(pattern);
        } catch (error) {
          console.error(`[templates] 无效的正则表达式: ${pattern}`, error);
          throw new Error(`无效的正则表达式: ${pattern}`);
        }
      }

      return { ...rule, pattern };
    }) || [];

  return await updateTemplateInDb(id, data, processedRules);
}

/**
 * 删除模板
 */
export async function deleteTemplate(id, username) {
  return await deleteTemplateFromDb(id, username);
}

/**
 * 添加规则到模板
 */
export async function addRule(templateId, data) {
  // 处理规则模式
  let pattern = data.pattern;

  // 注意：simple_include 和 simple_exclude 使用 includes() 方法，不需要正则转义
  // 只有正则表达式模式才需要特殊处理
  if (data.mode === 'regex' || data.mode === 'regex_include' || data.mode === 'regex_exclude') {
    // 验证正则表达式是否有效
    try {
      new RegExp(pattern);
    } catch (error) {
      console.error(`[templates] 无效的正则表达式: ${pattern}`, error);
      throw new Error(`无效的正则表达式: ${pattern}`);
    }
  }

  return await addRuleToTemplateInDb(templateId, { ...data, pattern });
}

/**
 * 删除规则
 */
export async function deleteRule(templateId, ruleId) {
  return await deleteRuleFromDb(templateId, ruleId);
}
