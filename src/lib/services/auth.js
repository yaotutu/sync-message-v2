import { validateUser } from '@/lib/services/users';

/**
 * @typedef {Object} AuthResult
 * @property {boolean} success - 验证是否成功
 * @property {string} [message] - 错误消息
 */

/**
 * 验证管理员权限
 * @param {Request} req - 请求对象
 * @returns {Promise<AuthResult>} 验证结果
 */
export async function verifyAdminAuth(req) {
  const username = req.headers.get('x-username');
  const password = req.headers.get('x-password');

  if (!username || !password) {
    return { success: false, message: '需要用户认证' };
  }

  try {
    // 验证用户名密码
    const validation = await validateUser(username, password);
    if (!validation.success) {
      return { success: false, message: validation.message };
    }

    // 检查isAdmin
    if (!validation.data.isAdmin) {
      return { success: false, message: '需要管理员权限' };
    }

    return { success: true, message: '' };
  } catch (error) {
    console.error('验证管理员权限失败:', error);
    return { success: false, message: '验证管理员权限失败，请稍后重试' };
  }
}
