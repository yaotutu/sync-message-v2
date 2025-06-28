/**
 * 获取用户认证状态
 * @returns {{
 *   isAuthenticated: boolean,
 *   isAdmin: boolean,
 *   username: string | null
 *   canManageTemplates: boolean,
 *   cardLinkTags: string[],
 *   showFooter: boolean,
 *   showAds: boolean
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
        canManageTemplates: false,
        cardLinkTags: [],
        showFooter: true,
        showAds: true,
      };
    }

    const auth = JSON.parse(storedAuth);
    return {
      isAuthenticated: !!auth.username && !!auth.password,
      isAdmin: !!auth.isAdmin,
      username: auth.username || null,
      canManageTemplates: auth.canManageTemplates || false,
      cardLinkTags: auth.cardLinkTags || [],
      showFooter: auth.showFooter !== undefined ? auth.showFooter : true,
      showAds: auth.showAds !== undefined ? auth.showAds : true,
    };
  } catch (err) {
    console.error('解析存储的用户信息失败:', err);
    localStorage.removeItem('user_auth');
    return {
      isAuthenticated: false,
      isAdmin: false,
      username: null,
      canManageTemplates: false,
      cardLinkTags: [],
      showFooter: true,
      showAds: true,
    };
  }
}

/**
 * 退出登录
 */
export function logout() {
  localStorage.removeItem('user_auth');
}
