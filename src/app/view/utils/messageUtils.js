/**
 * 提取短信中的验证码
 * @param {string} content - 短信内容
 * @returns {string|null} 验证码或null
 */
export function extractVerificationCode(content) {
    if (!content) return null;

    // 查找"验证码"后面的第一串数字
    const pattern = /验证码[^0-9]*(\d{4,8})/;
    const match = content.match(pattern);

    if (match && match[1]) {
        return match[1];
    }

    return null;
}

/**
 * 获取验证码数据的工具函数
 * @param {Object} param0
 * @param {string} param0.cardKey
 * @param {string} param0.appName
 * @param {string} [param0.phone]
 * @returns {Promise<Object>} 接口返回数据
 */
export async function fetchMessageData({ cardKey, appName, phone }) {
    const params = new URLSearchParams();
    params.append('cardKey', cardKey);
    params.append('appName', encodeURIComponent(appName));
    if (phone) {
        params.append('phone', phone);
    }
    const response = await fetch(`/api/public/messages?${params.toString()}`);
    return await response.json();
} 