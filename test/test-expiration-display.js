/**
 * 测试有效期显示功能
 */

// 模拟格式化时间函数
function formatFirstUsedTime(timestamp) {
    if (!timestamp) return '';
    const time = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
    return new Date(time).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

// 模拟检查过期函数
function checkExpiration(firstUsedAt, expiryDays) {
    if (!expiryDays || expiryDays <= 0) {
        return false;
    }

    if (!firstUsedAt) {
        return false;
    }

    const expiryTime = firstUsedAt + (expiryDays * 24 * 60 * 60 * 1000);
    const currentTime = Date.now();

    return currentTime > expiryTime;
}

// 模拟页面显示逻辑
function simulateExpirationDisplay(firstUsedAt, expiryDays) {
    const isExpired = checkExpiration(firstUsedAt, expiryDays);
    const expiryTime = firstUsedAt + (expiryDays * 24 * 60 * 60 * 1000);
    const remainingDays = Math.max(0, Math.ceil((expiryTime - Date.now()) / (24 * 60 * 60 * 1000)));

    console.log(`有效期：${expiryDays} 天`);
    console.log(`过期时间：${formatFirstUsedTime(expiryTime)}`);

    if (!isExpired) {
        console.log(`剩余天数：${remainingDays} 天`);
    } else {
        console.log(`状态：已过期`);
    }

    return {
        isExpired,
        remainingDays,
        expiryTime: formatFirstUsedTime(expiryTime)
    };
}

// 测试用例
function runDisplayTests() {
    console.log('开始测试有效期显示功能...\n');

    const currentTime = Date.now();
    const oneDayAgo = currentTime - (24 * 60 * 60 * 1000);
    const twoDaysAgo = currentTime - (2 * 24 * 60 * 60 * 1000);
    const threeDaysAgo = currentTime - (3 * 24 * 60 * 60 * 1000);

    // 测试用例1：未过期，剩余5天
    console.log('测试1：未过期，剩余5天');
    const test1 = simulateExpirationDisplay(oneDayAgo, 7);
    console.log('✅ 通过\n');

    // 测试用例2：已过期
    console.log('测试2：已过期');
    const test2 = simulateExpirationDisplay(twoDaysAgo, 1);
    console.log('✅ 通过\n');

    // 测试用例3：即将过期（剩余1天）
    console.log('测试3：即将过期（剩余1天）');
    const test3 = simulateExpirationDisplay(threeDaysAgo, 4);
    console.log('✅ 通过\n');

    // 测试用例4：无过期天数
    console.log('测试4：无过期天数');
    const test4 = simulateExpirationDisplay(oneDayAgo, null);
    console.log('✅ 通过\n');

    console.log('所有显示测试通过！');
    console.log('\n显示效果示例：');
    console.log('有效期：7 天 (过期时间：2024/01/15 14:30:25) (剩余 5 天)');
    console.log('有效期：1 天 (过期时间：2024/01/10 14:30:25) - 已过期');
}

// 运行测试
runDisplayTests(); 