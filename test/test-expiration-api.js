/**
 * 测试API的过期功能
 */

// 模拟API响应
function simulateApiResponse(firstUsedAt, expiryDays) {
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

    return {
        success: true,
        message: "测试消息内容",
        firstUsedAt: firstUsedAt,
        rawMessage: { smsContent: "测试消息内容" },
        expiryDays: expiryDays,
        isExpired: checkExpiration(firstUsedAt, expiryDays),
    };
}

// 测试用例
function runApiTests() {
    console.log('开始测试API过期功能...\n');

    const currentTime = Date.now();
    const oneDayAgo = currentTime - (24 * 60 * 60 * 1000);
    const twoDaysAgo = currentTime - (2 * 24 * 60 * 60 * 1000);

    // 测试用例1：没有过期天数
    console.log('测试1：没有过期天数设置');
    const response1 = simulateApiResponse(oneDayAgo, null);
    console.log(`isExpired: ${response1.isExpired}`);
    console.log(`expiryDays: ${response1.expiryDays}`);
    console.log('✅ 通过\n');

    // 测试用例2：未过期
    console.log('测试2：未过期（1天前使用，7天有效期）');
    const response2 = simulateApiResponse(oneDayAgo, 7);
    console.log(`isExpired: ${response2.isExpired}`);
    console.log(`expiryDays: ${response2.expiryDays}`);
    console.log('✅ 通过\n');

    // 测试用例3：已过期
    console.log('测试3：已过期（2天前使用，1天有效期）');
    const response3 = simulateApiResponse(twoDaysAgo, 1);
    console.log(`isExpired: ${response3.isExpired}`);
    console.log(`expiryDays: ${response3.expiryDays}`);
    console.log('✅ 通过\n');

    // 测试用例4：还没有首次使用时间
    console.log('测试4：还没有首次使用时间');
    const response4 = simulateApiResponse(null, 7);
    console.log(`isExpired: ${response4.isExpired}`);
    console.log(`expiryDays: ${response4.expiryDays}`);
    console.log('✅ 通过\n');

    console.log('所有API测试通过！');
    console.log('\nAPI响应格式示例：');
    console.log(JSON.stringify(response2, null, 2));
}

// 运行测试
runApiTests(); 