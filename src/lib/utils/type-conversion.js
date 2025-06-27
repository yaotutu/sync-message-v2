/**
 * 类型转换工具函数
 * 统一处理BigInt、字符串和数字类型的转换
 */

/**
 * 安全地将任意类型转换为数字
 * 支持 BigInt、字符串、数字类型的转换
 * 
 * @param {any} value - 要转换的值
 * @param {number} [defaultValue=0] - 转换失败时的默认值
 * @returns {number} 转换后的数字
 * 
 * @example
 * safeToNumber(BigInt(123)) // 123
 * safeToNumber("456") // 456
 * safeToNumber(789) // 789
 * safeToNumber(null) // 0
 * safeToNumber(undefined) // 0
 * safeToNumber("invalid", 100) // 100
 */
export function safeToNumber(value, defaultValue = 0) {
    // 处理 null 和 undefined
    if (value === null || value === undefined) {
        return defaultValue;
    }

    // 处理 BigInt 类型
    if (typeof value === 'bigint') {
        return Number(value);
    }

    // 处理字符串类型
    if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    // 处理数字类型
    if (typeof value === 'number') {
        return isNaN(value) ? defaultValue : value;
    }

    // 其他类型返回默认值
    return defaultValue;
}

/**
 * 安全地将任意类型转换为字符串
 * 
 * @param {any} value - 要转换的值
 * @param {string} [defaultValue=""] - 转换失败时的默认值
 * @returns {string} 转换后的字符串
 */
export function safeToString(value, defaultValue = "") {
    if (value === null || value === undefined) {
        return defaultValue;
    }

    return String(value);
}

/**
 * 安全地将任意类型转换为布尔值
 * 
 * @param {any} value - 要转换的值
 * @param {boolean} [defaultValue=false] - 转换失败时的默认值
 * @returns {boolean} 转换后的布尔值
 */
export function safeToBoolean(value, defaultValue = false) {
    if (value === null || value === undefined) {
        return defaultValue;
    }

    if (typeof value === 'boolean') {
        return value;
    }

    if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    }

    if (typeof value === 'number') {
        return value !== 0;
    }

    return Boolean(value);
}

/**
 * 计算时间戳的过期时间
 * 
 * @param {any} firstUsedAt - 首次使用时间戳
 * @param {any} expiryDays - 过期天数
 * @returns {number} 过期时间戳
 */
export function calculateExpiryTime(firstUsedAt, expiryDays) {
    const firstUsedAtNum = safeToNumber(firstUsedAt);
    const expiryDaysNum = safeToNumber(expiryDays);

    if (firstUsedAtNum === 0 || expiryDaysNum === 0) {
        return 0;
    }

    return firstUsedAtNum + (expiryDaysNum * 24 * 60 * 60 * 1000);
}

/**
 * 计算剩余天数
 * 
 * @param {any} firstUsedAt - 首次使用时间戳
 * @param {any} expiryDays - 过期天数
 * @returns {number} 剩余天数
 */
export function calculateRemainingDays(firstUsedAt, expiryDays) {
    const expiryTime = calculateExpiryTime(firstUsedAt, expiryDays);

    if (expiryTime === 0) {
        return 0;
    }

    return Math.max(0, Math.ceil((expiryTime - Date.now()) / (24 * 60 * 60 * 1000)));
}

/**
 * 检查是否过期
 * 
 * @param {any} firstUsedAt - 首次使用时间戳
 * @param {any} expiryDays - 过期天数
 * @returns {boolean} 是否过期
 */
export function checkExpiration(firstUsedAt, expiryDays) {
    // 如果没有设置过期天数，则永不过期
    if (!expiryDays || safeToNumber(expiryDays) <= 0) {
        return false;
    }

    // 如果还没有首次使用时间，则未过期
    if (!firstUsedAt) {
        return false;
    }

    const expiryTime = calculateExpiryTime(firstUsedAt, expiryDays);
    const currentTime = Date.now();

    return currentTime > expiryTime;
}

/**
 * 格式化时间戳为本地时间字符串
 * 
 * @param {any} timestamp - 时间戳
 * @param {string} [locale='zh-CN'] - 地区设置
 * @returns {string} 格式化后的时间字符串
 */
export function formatTimestamp(timestamp, locale = 'zh-CN') {
    const timeNum = safeToNumber(timestamp);

    if (timeNum === 0) {
        return '';
    }

    return new Date(timeNum).toLocaleString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * 获取当前时间戳
 * 
 * @returns {number} 当前时间戳
 */
export function getCurrentTimestamp() {
    return Date.now();
}

/**
 * 获取指定天数后的时间戳
 * 
 * @param {any} days - 天数
 * @returns {number} 时间戳
 */
export function getTimestampAfterDays(days) {
    const daysNum = safeToNumber(days);
    return Date.now() + (daysNum * 24 * 60 * 60 * 1000);
}

/**
 * 获取指定天数前的时间戳
 * 
 * @param {any} days - 天数
 * @returns {number} 时间戳
 */
export function getTimestampBeforeDays(days) {
    const daysNum = safeToNumber(days);
    return Date.now() - (daysNum * 24 * 60 * 60 * 1000);
} 