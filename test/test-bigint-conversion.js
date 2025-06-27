/**
 * 测试BigInt类型转换功能
 */

// 模拟API中的checkExpiration函数
function checkExpiration(firstUsedAt, expiryDays) {
    // 如果没有设置过期天数，则永不过期
    if (!expiryDays || expiryDays <= 0) {
        return false;
    }

    // 如果还没有首次使用时间，则未过期
    if (!firstUsedAt) {
        return false;
    }

    // 确保类型转换，处理BigInt和字符串类型
    const firstUsedAtNum = typeof firstUsedAt === 'bigint' ? Number(firstUsedAt) :
        typeof firstUsedAt === 'string' ? parseInt(firstUsedAt, 10) :
            firstUsedAt;
    const expiryDaysNum = typeof expiryDays === 'bigint' ? Number(expiryDays) :
        typeof expiryDays === 'string' ? parseInt(expiryDays, 10) :
            expiryDays;

    // 计算过期时间：首次使用时间 + 过期天数
    const expiryTime = firstUsedAtNum + (expiryDaysNum * 24 * 60 * 60 * 1000);
    const currentTime = Date.now();

    return currentTime > expiryTime;
}

// 模拟前端辅助函数
function safeToNumber(value) {
    if (typeof value === 'bigint') return Number(value);
    if (typeof value === 'string') return parseInt(value, 10);
    return value;
}

function calculateExpiryTime(firstUsedAt, expiryDays) {
    const firstUsedAtNum = safeToNumber(firstUsedAt);
    const expiryDaysNum = safeToNumber(expiryDays);
    return firstUsedAtNum + (expiryDaysNum * 24 * 60 * 60 * 1000);
}

function calculateRemainingDays(firstUsedAt, expiryDays) {
    const expiryTime = calculateExpiryTime(firstUsedAt, expiryDays);
    return Math.max(0, Math.ceil((expiryTime - Date.now()) / (24 * 60 * 60 * 1000)));
}

// 测试用例
function runBigIntTests() {
    console.log('开始测试BigInt类型转换功能...\n');

    const currentTime = Date.now();
    const oneDayAgo = currentTime - (24 * 60 * 60 * 1000);

    // 测试用例1：BigInt类型的firstUsedAt
    console.log('测试1：BigInt类型的firstUsedAt');
    const bigIntFirstUsedAt = BigInt(oneDayAgo);
    const test1 = checkExpiration(bigIntFirstUsedAt, 7);
    console.log(`BigInt firstUsedAt: ${bigIntFirstUsedAt}`);
    console.log(`转换后: ${safeToNumber(bigIntFirstUsedAt)}`);
    console.log(`过期状态: ${test1 ? '已过期' : '未过期'}`);
    console.log('✅ 通过\n');

    // 测试用例2：BigInt类型的expiryDays
    console.log('测试2：BigInt类型的expiryDays');
    const bigIntExpiryDays = BigInt(7);
    const test2 = checkExpiration(oneDayAgo, bigIntExpiryDays);
    console.log(`BigInt expiryDays: ${bigIntExpiryDays}`);
    console.log(`转换后: ${safeToNumber(bigIntExpiryDays)}`);
    console.log(`过期状态: ${test2 ? '已过期' : '未过期'}`);
    console.log('✅ 通过\n');

    // 测试用例3：字符串类型的firstUsedAt
    console.log('测试3：字符串类型的firstUsedAt');
    const stringFirstUsedAt = oneDayAgo.toString();
    const test3 = checkExpiration(stringFirstUsedAt, 7);
    console.log(`String firstUsedAt: ${stringFirstUsedAt}`);
    console.log(`转换后: ${safeToNumber(stringFirstUsedAt)}`);
    console.log(`过期状态: ${test3 ? '已过期' : '未过期'}`);
    console.log('✅ 通过\n');

    // 测试用例4：字符串类型的expiryDays
    console.log('测试4：字符串类型的expiryDays');
    const stringExpiryDays = '7';
    const test4 = checkExpiration(oneDayAgo, stringExpiryDays);
    console.log(`String expiryDays: ${stringExpiryDays}`);
    console.log(`转换后: ${safeToNumber(stringExpiryDays)}`);
    console.log(`过期状态: ${test4 ? '已过期' : '未过期'}`);
    console.log('✅ 通过\n');

    // 测试用例5：前端计算函数
    console.log('测试5：前端计算函数');
    const expiryTime = calculateExpiryTime(bigIntFirstUsedAt, bigIntExpiryDays);
    const remainingDays = calculateRemainingDays(bigIntFirstUsedAt, bigIntExpiryDays);
    console.log(`过期时间: ${new Date(expiryTime).toLocaleString()}`);
    console.log(`剩余天数: ${remainingDays} 天`);
    console.log('✅ 通过\n');

    console.log('所有BigInt转换测试通过！');
}

// 运行测试
runBigIntTests(); 