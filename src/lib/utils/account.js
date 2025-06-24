/**
 * 账号有效期相关工具函数
 */

/**
 * 检查账号是否有效
 * @param {string|null} expiryDate 有效期日期(YYYYMMDD格式)
 * @returns {boolean}
 */
export function isAccountActive(expiryDate) {
  if (!expiryDate) return true;
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return expiryDate >= today;
}

/**
 * 获取永久有效日期
 * @returns {string}
 */
export function getPermanentExpiryDate() {
  return process.env.PERMANENT_EXPIRY_DATE || '20991231';
}

/**
 * 格式化有效期显示
 * @param {string|null} expiryDate
 * @returns {string}
 */
export function formatExpiryDate(expiryDate) {
  if (!expiryDate || expiryDate === getPermanentExpiryDate()) {
    return '永久有效';
  }
  return expiryDate;
}
