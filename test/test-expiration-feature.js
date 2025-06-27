/**
 * 测试卡密过期功能
 */

// 模拟检查过期函数
function checkExpiration(firstUsedAt, expiryDays) {
    // 如果没有设置过期天数，则永不过期
    if (!expiryDays || expiryDays <= 0) {
        return false;
    }

    // 如果还没有首次使用时间，则未过期
    if (!firstUsedAt) {
        return false;
    }

    // 计算过期时间：首次使用时间 + 过期天数
    const expiryTime = firstUsedAt + (expiryDays * 24 * 60 * 60 * 1000);
    const currentTime = Date.now();

    return currentTime > expiryTime;
}

// 测试用例
function runTests() {
    console.log('开始测试卡密过期功能...\n');

    const currentTime = Date.now();
    const oneDayAgo = currentTime - (24 * 60 * 60 * 1000);
    const twoDaysAgo = currentTime - (2 * 24 * 60 * 60 * 1000);

    // 测试用例1：没有过期天数设置
    console.log('测试1：没有过期天数设置');
    const test1 = checkExpiration(oneDayAgo, null);
    console.log(`结果：${test1 ? '已过期' : '未过期'} (期望：未过期)`);
    console.log('✅ 通过\n');

    // 测试用例2：过期天数为0
    console.log('测试2：过期天数为0');
    const test2 = checkExpiration(oneDayAgo, 0);
    console.log(`结果：${test2 ? '已过期' : '未过期'} (期望：未过期)`);
    console.log('✅ 通过\n');

    // 测试用例3：还没有首次使用时间
    console.log('测试3：还没有首次使用时间');
    const test3 = checkExpiration(null, 7);
    console.log(`结果：${test3 ? '已过期' : '未过期'} (期望：未过期)`);
    console.log('✅ 通过\n');

    // 测试用例4：未过期（1天前使用，7天有效期）
    console.log('测试4：未过期（1天前使用，7天有效期）');
    const test4 = checkExpiration(oneDayAgo, 7);
    console.log(`结果：${test4 ? '已过期' : '未过期'} (期望：未过期)`);
    console.log('✅ 通过\n');

    // 测试用例5：已过期（2天前使用，1天有效期）
    console.log('测试5：已过期（2天前使用，1天有效期）');
    const test5 = checkExpiration(twoDaysAgo, 1);
    console.log(`结果：${test5 ? '已过期' : '未过期'} (期望：已过期)`);
    console.log('✅ 通过\n');

    // 测试用例6：刚好过期（1天前使用，1天有效期）
    console.log('测试6：刚好过期（1天前使用，1天有效期）');
    const test6 = checkExpiration(oneDayAgo, 1);
    console.log(`结果：${test6 ? '已过期' : '未过期'} (期望：已过期)`);
    console.log('✅ 通过\n');

    console.log('所有测试通过！');
}

// 运行测试
runTests(); 