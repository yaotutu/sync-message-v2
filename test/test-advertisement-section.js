/**
 * 测试广告组件功能
 * 
 * 测试步骤：
 * 1. 测试API端点是否正常工作
 * 2. 测试组件是否正确处理showAds设置
 */

// 测试API端点
async function testUserAdsSettingAPI() {
    console.log('=== 测试用户广告设置API ===');

    // 测试缺少cardKey参数
    try {
        const response1 = await fetch('http://localhost:3000/api/public/user-ads-setting');
        const result1 = await response1.json();
        console.log('缺少cardKey参数测试:', result1);
    } catch (error) {
        console.error('API测试失败:', error);
    }

    // 测试无效的cardKey
    try {
        const response2 = await fetch('http://localhost:3000/api/public/user-ads-setting?cardKey=INVALID_KEY');
        const result2 = await response2.json();
        console.log('无效cardKey测试:', result2);
    } catch (error) {
        console.error('API测试失败:', error);
    }

    // 测试有效的cardKey（需要替换为实际的cardKey）
    try {
        const response3 = await fetch('http://localhost:3000/api/public/user-ads-setting?cardKey=TESTKEY123');
        const result3 = await response3.json();
        console.log('有效cardKey测试:', result3);
    } catch (error) {
        console.error('API测试失败:', error);
    }
}

// 运行测试
if (typeof window === 'undefined') {
    // Node.js环境
    testUserAdsSettingAPI();
} else {
    // 浏览器环境
    console.log('请在Node.js环境中运行此测试');
} 