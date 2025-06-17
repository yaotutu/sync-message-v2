const { randomUUID } = require('crypto');
const db = require('./db/templates');

/**
 * 将简单文本模式转换为正则表达式
 * @param {string} pattern - 简单模式字符串
 * @returns {string} 转义后的正则表达式字符串
 */
function convertSimplePatternToRegex(pattern) {
  // 转义正则表达式特殊字符
  return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 测试消息是否匹配规则
 * @param {string} message - 要测试的消息
 * @param {Object} rule - 规则对象
 * @param {string} rule.mode - 规则模式
 * @param {string} rule.pattern - 模式字符串
 * @param {string} rule.type - 规则类型(include/exclude)
 * @returns {boolean} 是否匹配
 */
function testMessage(message, rule) {
  try {
    const pattern =
      rule.mode === 'regex' ? new RegExp(rule.pattern) : new RegExp(rule.pattern, 'i'); // 简单模式使用不区分大小写的匹配

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

/**
 * 获取所有模板
 * @returns {Promise<Array>} 模板数组
 */
async function getAllTemplates() {
  return await db.getAllTemplates();
}

/**
 * 获取单个模板
 * @param {string} id - 模板ID
 * @returns {Promise<Object|null>} 模板对象或null
 */
async function getTemplateById(id) {
  return await db.getTemplateById(id);
}

/**
 * 根据名称获取模板
 * @param {string} name - 模板名称
 * @returns {Promise<Object|null>} 模板对象或null
 */
async function getTemplateByName(name) {
  return await db.getTemplateByName(name);
}

/**
 * 创建新模板
 * @param {Object} data - 模板数据
 * @param {string} data.name - 模板名称
 * @param {string} data.description - 模板描述
 * @param {Array} [data.rules] - 规则数组
 * @returns {Promise<Object>} 创建的模板对象
 */
async function createTemplate(data) {
  // 处理简单模式的规则
  if (data.rules) {
    data.rules = data.rules.map((rule) => {
      if (rule.mode === 'simple_include' || rule.mode === 'simple_exclude') {
        return {
          ...rule,
          pattern: convertSimplePatternToRegex(rule.pattern),
        };
      }
      return rule;
    });
  }
  return await db.createTemplate(data);
}

/**
 * 删除模板
 * @param {string} id - 模板ID
 * @returns {Promise<boolean>} 是否删除成功
 */
async function deleteTemplate(id) {
  return await db.deleteTemplate(id);
}

/**
 * 添加规则
 * @param {string} templateId - 模板ID
 * @param {Object} data - 规则数据
 * @param {string} data.type - 规则类型
 * @param {string} data.mode - 规则模式
 * @param {string} data.pattern - 模式字符串
 * @param {string} data.description - 规则描述
 * @returns {Promise<Object|null>} 添加的规则对象或null
 */
async function addRule(templateId, data) {
  // 检查模板是否存在
  const template = await getTemplateById(templateId);
  if (!template) return null;

  // 如果是简单模式，将文本转换为正则安全的模式
  if (data.mode === 'simple_include' || data.mode === 'simple_exclude') {
    data.pattern = convertSimplePatternToRegex(data.pattern);
  } else {
    // 验证正则表达式是否有效
    try {
      new RegExp(data.pattern);
    } catch (e) {
      throw new Error('无效的正则表达式');
    }
  }

  return await db.addRule(templateId, data);
}

/**
 * 删除规则
 * @param {string} templateId - 模板ID
 * @param {string} ruleId - 规则ID
 * @returns {Promise<boolean>} 是否删除成功
 */
async function deleteRule(templateId, ruleId) {
  return await db.deleteRule(templateId, ruleId);
}

/**
 * 更新模板
 * @param {string} id - 模板ID
 * @param {Object} data - 更新数据
 * @param {string} [data.name] - 新名称
 * @param {string} [data.description] - 新描述
 * @param {Array} [data.rules] - 新规则数组
 * @returns {Promise<Object|null>} 更新后的模板对象或null
 */
async function updateTemplate(id, data) {
  // 处理简单模式的规则
  if (data.rules) {
    data.rules = data.rules.map((rule) => {
      if (rule.mode === 'simple_include' || rule.mode === 'simple_exclude') {
        return {
          ...rule,
          pattern: convertSimplePatternToRegex(rule.pattern),
        };
      }
      return rule;
    });
  }
  return await db.updateTemplate(id, data);
}

module.exports = {
  convertSimplePatternToRegex,
  testMessage,
  getAllTemplates,
  getTemplateById,
  getTemplateByName,
  createTemplate,
  deleteTemplate,
  addRule,
  deleteRule,
  updateTemplate,
};
