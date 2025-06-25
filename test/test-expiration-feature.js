// 测试有效期功能的公共环境变量检测
const testExpirationFeature = () => {
    console.log('=== 测试有效期功能公共环境变量检测 ===');

    // 模拟不同的环境变量设置
    const testCases = [
        { env: 'true', expected: true, description: 'NEXT_PUBLIC_USER_EXPIRATION_ENABLED=true' },
        { env: 'false', expected: false, description: 'NEXT_PUBLIC_USER_EXPIRATION_ENABLED=false' },
        { env: undefined, expected: false, description: 'NEXT_PUBLIC_USER_EXPIRATION_ENABLED未设置' },
        { env: 'TRUE', expected: false, description: 'NEXT_PUBLIC_USER_EXPIRATION_ENABLED=TRUE (大写)' },
        { env: '1', expected: false, description: 'NEXT_PUBLIC_USER_EXPIRATION_ENABLED=1' },
    ];

    testCases.forEach(({ env, expected, description }) => {
        // 模拟环境变量
        const originalEnv = process.env.NEXT_PUBLIC_USER_EXPIRATION_ENABLED;
        if (env === undefined) {
            delete process.env.NEXT_PUBLIC_USER_EXPIRATION_ENABLED;
        } else {
            process.env.NEXT_PUBLIC_USER_EXPIRATION_ENABLED = env;
        }

        // 测试逻辑（模拟前端代码）
        const isEnabled = process.env.NEXT_PUBLIC_USER_EXPIRATION_ENABLED === 'true';
        const passed = isEnabled === expected;

        console.log(`${passed ? '✅' : '❌'} ${description}`);
        console.log(`   环境变量值: ${env || 'undefined'}`);
        console.log(`   检测结果: ${isEnabled}`);
        console.log(`   期望结果: ${expected}`);
        console.log('');

        // 恢复环境变量
        if (originalEnv === undefined) {
            delete process.env.NEXT_PUBLIC_USER_EXPIRATION_ENABLED;
        } else {
            process.env.NEXT_PUBLIC_USER_EXPIRATION_ENABLED = originalEnv;
        }
    });

    console.log('=== 测试完成 ===');
    console.log('💡 提示：在 .env 文件中设置 NEXT_PUBLIC_USER_EXPIRATION_ENABLED=true 来启用有效期功能');
};

// 运行测试
testExpirationFeature(); 