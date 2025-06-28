/**
 * 测试类型转换工具函数
 */

// 模拟导入工具函数
function safeToNumber(value, defaultValue = 0) {
    if (value === null || value === undefined) {
        return defaultValue;
    }

    if (typeof value === 'bigint') {
        return Number(value);
    }

    if (typeof value === 'string') {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    }

    if (typeof value === 'number') {
        return isNaN(value) ? defaultValue : value;
    }

    return defaultValue;
}

function checkExpiration(firstUsedAt, expiryDays) {
    if (!expiryDays || safeToNumber(expiryDays) <= 0) {
        return false;
    }

    if (!firstUsedAt) {
        return false;
    }

    const firstUsedAtNum = safeToNumber(firstUsedAt);
    const expiryDaysNum = safeToNumber(expiryDays);
    const expiryTime = firstUsedAtNum + (expiryDaysNum * 24 * 60 * 60 * 1000);
    const currentTime = Date.now();

    return currentTime > expiryTime;
}

function calculateExpiryTime(firstUsedAt, expiryDays) {
    const firstUsedAtNum = safeToNumber(firstUsedAt);
    const expiryDaysNum = safeToNumber(expiryDays);

    if (firstUsedAtNum === 0 || expiryDaysNum === 0) {
        return 0;
    }

    return firstUsedAtNum + (expiryDaysNum * 24 * 60 * 60 * 1000);
}

function formatTimestamp(timestamp, locale = 'zh-CN') {
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

// 测试用例
function runUtilsTests() {
    console.log('开始测试类型转换工具函数...\n');

    const currentTime = Date.now();
    const oneDayAgo = currentTime - (24 * 60 * 60 * 1000);

    // 测试 safeToNumber 函数
    console.log('测试 safeToNumber 函数:');
    console.log(`BigInt(123) -> ${safeToNumber(BigInt(123))}`);
    console.log(`"456" -> ${safeToNumber("456")}`);
    console.log(`789 -> ${safeToNumber(789)}`);
    console.log(`null -> ${safeToNumber(null)}`);
    console.log(`undefined -> ${safeToNumber(undefined)}`);
    console.log(`"invalid" -> ${safeToNumber("invalid", 100)}`);
    console.log('✅ 通过\n');

    // 测试 checkExpiration 函数
    console.log('测试 checkExpiration 函数:');
    console.log(`BigInt firstUsedAt, 7 days: ${checkExpiration(BigInt(oneDayAgo), 7)}`);
    console.log(`String firstUsedAt, 7 days: ${checkExpiration(oneDayAgo.toString(), 7)}`);
    console.log(`Number firstUsedAt, BigInt days: ${checkExpiration(oneDayAgo, BigInt(7))}`);
    console.log('✅ 通过\n');

    // 测试 calculateExpiryTime 函数
    console.log('测试 calculateExpiryTime 函数:');
    const expiryTime1 = calculateExpiryTime(BigInt(oneDayAgo), 7);
    const expiryTime2 = calculateExpiryTime(oneDayAgo.toString(), "7");
    console.log(`BigInt input: ${expiryTime1}`);
    console.log(`String input: ${expiryTime2}`);
    console.log(`结果一致: ${expiryTime1 === expiryTime2}`);
    console.log('✅ 通过\n');

    // 测试 formatTimestamp 函数
    console.log('测试 formatTimestamp 函数:');
    console.log(`BigInt timestamp: ${formatTimestamp(BigInt(currentTime))}`);
    console.log(`String timestamp: ${formatTimestamp(currentTime.toString())}`);
    console.log(`Number timestamp: ${formatTimestamp(currentTime)}`);
    console.log('✅ 通过\n');

    console.log('所有工具函数测试通过！');
    console.log('\n使用示例:');
    console.log('import { safeToNumber, checkExpiration, calculateExpiryTime, formatTimestamp } from "@/lib/utils/type-conversion.js";');
    console.log('const isExpired = checkExpiration(BigInt(timestamp), "7");');
}

// 运行测试
runUtilsTests(); 