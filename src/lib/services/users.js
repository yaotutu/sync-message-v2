'use strict';

import {
  createUserDb,
  getUserByIdDb,
  deleteUserDb,
  getAllUsersDb,
  validateUserDb,
  getUserByUsernameDb,
  updateUserDb,
} from '../db/users.js';
import { randomUUID } from 'crypto';

/**
 * 创建用户
 * @param {string} username
 * @param {string} password
 * @param {boolean} canManageTemplates
 * @param {boolean} showFooter 是否显示底部
 * @param {boolean} showAds 是否显示广告
 * @param {string[]} emails 用户邮箱列表
 */
async function createUser(
  username,
  password,
  canManageTemplates = false,
  showFooter = true,
  showAds = true,
  emails = [],
) {
  try {
    const webhookKey = randomUUID();
    const now = Date.now();
    const cardLinkTags = []; // 新用户默认空标签数组，由用户自己维护

    const result = await createUserDb(
      username,
      password,
      webhookKey,
      now,
      canManageTemplates,
      cardLinkTags,
      emails,
      showFooter,
      showAds,
    );
    if (result.error) {
      return { success: false, message: result.error };
    }
    if (!result.lastID) {
      return { success: false, message: '创建用户失败' };
    }

    return {
      success: true,
      data: {
        id: result.lastID,
        username,
        webhookKey,
        cardLinkTags,
        emails,
        showFooter,
        showAds,
      },
    };
  } catch (error) {
    console.error('创建用户失败:', error);
    return { success: false, message: '创建用户失败，请稍后重试' };
  }
}

async function getUser(userId) {
  try {
    const user = await getUserByIdDb(userId);
    if (!user) {
      return { success: false, message: '用户不存在' };
    }
    return { success: true, data: user };
  } catch (error) {
    console.error('获取用户失败:', error);
    return { success: false, message: '获取用户失败，请稍后重试' };
  }
}

async function deleteUser(username) {
  try {
    const result = await deleteUserDb(username);
    return { success: true };
  } catch (error) {
    console.error('删除用户失败:', error);
    return { success: false, message: '删除用户失败，请稍后重试' };
  }
}

async function getAllUsers() {
  try {
    const users = await getAllUsersDb();
    const formattedUsers = users.map((user) => ({
      ...user,
      createdAt: new Date(Number(user.createdAt)).toISOString(),
    }));
    return { success: true, data: formattedUsers };
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return { success: false, message: '获取用户列表失败，请稍后重试' };
  }
}

async function validateUser(username, password) {
  try {
    const user = await validateUserDb(username, password);
    if (!user) {
      return { success: false, message: '用户名或密码错误' };
    }
    return { success: true, data: user };
  } catch (error) {
    console.error('验证用户失败:', error);
    return { success: false, message: '验证用户失败，请稍后重试' };
  }
}

async function getUserByUsername(username) {
  try {
    const user = await getUserByUsernameDb(username);
    if (!user) {
      return { success: false, message: '用户不存在' };
    }
    return { success: true, data: user };
  } catch (error) {
    console.error('获取用户失败:', error);
    return { success: false, message: '获取用户失败，请稍后重试' };
  }
}

/**
 * 更新用户信息
 * @param {string} username
 * @param {object} updates 更新字段对象
 */
async function updateUser(username, updates) {
  try {
    const validUpdates = {};

    // 现有字段验证
    if ('canManageTemplates' in updates) {
      validUpdates.canManageTemplates = updates.canManageTemplates;
    }
    if ('accountStatus' in updates) {
      validUpdates.accountStatus = updates.accountStatus;
    }
    if ('expiryDate' in updates) {
      if (updates.expiryDate && !/^\d{8}$/.test(updates.expiryDate)) {
        return { success: false, message: '有效期格式应为YYYYMMDD' };
      }
      validUpdates.expiryDate = updates.expiryDate || null;
    }

    // 管理员控制的字段验证
    if ('showFooter' in updates) {
      if (typeof updates.showFooter !== 'boolean') {
        return { success: false, message: 'showFooter必须是布尔值' };
      }
      validUpdates.showFooter = updates.showFooter;
    }

    if ('showAds' in updates) {
      if (typeof updates.showAds !== 'boolean') {
        return { success: false, message: 'showAds必须是布尔值' };
      }
      validUpdates.showAds = updates.showAds;
    }

    if ('emails' in updates) {
      if (!Array.isArray(updates.emails)) {
        return { success: false, message: '邮箱列表必须是数组格式' };
      }
      // 验证邮箱格式
      for (const email of updates.emails) {
        if (typeof email !== 'string' || !email.includes('@')) {
          return { success: false, message: '邮箱格式不正确' };
        }
        if (email.length > 100) {
          return { success: false, message: '邮箱长度不能超过100个字符' };
        }
      }
      validUpdates.emails = updates.emails;
    }

    if (Object.keys(validUpdates).length === 0) {
      return { success: false, message: '没有有效的更新字段' };
    }

    await updateUserDb(username, validUpdates);
    return { success: true };
  } catch (error) {
    console.error('更新用户失败:', error);
    return { success: false, message: '更新用户失败，请稍后重试' };
  }
}

async function isAdmin(username, password) {
  try {
    const validation = await validateUser(username, password);
    if (!validation.success) {
      return validation; // 返回验证失败结果
    }

    // 假设管理员用户名为'admin'，可根据实际需求修改
    const isAdmin = validation.data.username === 'admin';
    return {
      success: true,
      data: { isAdmin },
    };
  } catch (error) {
    console.error('验证管理员权限失败:', error);
    return { success: false, message: '验证管理员权限失败，请稍后重试' };
  }
}

async function canManageTemplates(username, password) {
  try {
    const validation = await validateUser(username, password);
    if (!validation.success) {
      return validation; // 返回验证失败结果
    }

    // 使用用户记录中的canManageTemplates字段
    const canManage = Boolean(validation.data.canManageTemplates);
    return {
      success: true,
      data: { canManage },
    };
  } catch (error) {
    console.error('验证模板管理权限失败:', error);
    return { success: false, message: '验证模板管理权限失败，请稍后重试' };
  }
}

/**
 * 更新用户个人设置（用户自己调用）
 * @param {string} username
 * @param {object} updates 更新字段对象
 */
async function updateUserProfile(username, updates) {
  try {
    const validUpdates = {};

    // 允许用户更新cardLinkTags和emails字段
    if ('cardLinkTags' in updates) {
      if (!Array.isArray(updates.cardLinkTags)) {
        return { success: false, message: '卡密链接标签必须是数组格式' };
      }
      // 验证标签内容
      for (const tag of updates.cardLinkTags) {
        if (typeof tag !== 'string' || tag.trim().length === 0) {
          return { success: false, message: '卡密链接标签不能为空' };
        }
        if (tag.length > 50) {
          return { success: false, message: '卡密链接标签长度不能超过50个字符' };
        }
      }
      validUpdates.cardLinkTags = updates.cardLinkTags;
    }

    if ('emails' in updates) {
      if (!Array.isArray(updates.emails)) {
        return { success: false, message: '邮箱列表必须是数组格式' };
      }
      // 验证邮箱格式
      for (const email of updates.emails) {
        if (typeof email !== 'string' || !email.includes('@')) {
          return { success: false, message: '邮箱格式不正确' };
        }
        if (email.length > 100) {
          return { success: false, message: '邮箱长度不能超过100个字符' };
        }
      }
      validUpdates.emails = updates.emails;
    }

    if (Object.keys(validUpdates).length === 0) {
      return { success: false, message: '没有有效的更新字段' };
    }

    await updateUserDb(username, validUpdates);
    return { success: true };
  } catch (error) {
    console.error('更新用户设置失败:', error);
    return { success: false, message: '更新用户设置失败，请稍后重试' };
  }
}

export {
  createUser,
  getUser,
  deleteUser,
  getAllUsers,
  validateUser,
  getUserByUsername,
  updateUser,
  isAdmin,
  canManageTemplates,
  updateUserProfile,
};
