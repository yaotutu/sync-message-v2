/**
 * 获取用户认证状态
 * @returns {{
 *   isAuthenticated: boolean,
 *   isAdmin: boolean,
 *   username: string | null
 * }} 认证状态对象
 */
export function getAuthStatus() {
  try {
    const storedAuth = localStorage.getItem('user_auth');

    if (!storedAuth) {
      return {
        isAuthenticated: false,
        isAdmin: false,
        username: null,
      };
    }

    const auth = JSON.parse(storedAuth);
    return {
      isAuthenticated: !!auth.username && !!auth.password,
      isAdmin: !!auth.isAdmin,
      username: auth.username || null,
    };
  } catch (err) {
    console.error('解析存储的用户信息失败:', err);
    localStorage.removeItem('user_auth');
    return {
      isAuthenticated: false,
      isAdmin: false,
      username: null,
    };
  }
}
