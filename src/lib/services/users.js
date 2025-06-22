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

async function createUser(username, password, canManageTemplates = false) {
  try {
    const webhookKey = randomUUID();
    const now = Date.now();

    const result = await createUserDb(username, password, webhookKey, now, canManageTemplates);
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

async function updateUser(username, updates) {
  try {
    const validUpdates = {};
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
};
