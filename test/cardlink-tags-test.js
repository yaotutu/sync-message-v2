/**
 * 卡密链接标签功能测试
 */

// 测试用户信息
const testUser = {
    username: 'aaa',
    password: 'aaa'
};

/**
 * 测试创建带标签的卡密链接
 */
async function testCreateCardLinkWithTags() {
    console.log('=== 测试创建带标签的卡密链接 ===');

    try {
        const response = await fetch('http://localhost:3000/api/user/cardlinks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-username': testUser.username,
                'x-password': testUser.password
            },
            body: JSON.stringify({
                appName: '测试应用',
                phone: '13800138000',
                tags: ['工作', '重要']
            })
        });

        const data = await response.json();
        console.log('状态码:', response.status);
        console.log('响应数据:', JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('✅ 创建带标签的卡密链接成功');
            console.log('卡密链接:', data.data.cardKey);
            console.log('标签:', data.data.tags);
        } else {
            console.log('❌ 创建带标签的卡密链接失败:', data.message);
        }
    } catch (error) {
        console.error('❌ 请求失败:', error.message);
    }
}

/**
 * 测试创建不带标签的卡密链接
 */
async function testCreateCardLinkWithoutTags() {
    console.log('\n=== 测试创建不带标签的卡密链接 ===');

    try {
        const response = await fetch('http://localhost:3000/api/user/cardlinks', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-username': testUser.username,
                'x-password': testUser.password
            },
            body: JSON.stringify({
                appName: '测试应用2',
                phone: '13800138001'
            })
        });

        const data = await response.json();
        console.log('状态码:', response.status);
        console.log('响应数据:', JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('✅ 创建不带标签的卡密链接成功');
            console.log('卡密链接:', data.data.cardKey);
            console.log('标签:', data.data.tags);
        } else {
            console.log('❌ 创建不带标签的卡密链接失败:', data.message);
        }
    } catch (error) {
        console.error('❌ 请求失败:', error.message);
    }
}

/**
 * 测试获取卡密链接列表
 */
async function testGetCardLinks() {
    console.log('\n=== 测试获取卡密链接列表 ===');

    try {
        const response = await fetch('http://localhost:3000/api/user/cardlinks', {
            method: 'GET',
            headers: {
                'x-username': testUser.username,
                'x-password': testUser.password
            }
        });

        const data = await response.json();
        console.log('状态码:', response.status);
        console.log('响应数据:', JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('✅ 获取卡密链接列表成功');
            console.log('卡密链接数量:', data.data.length);

            // 显示每个卡密链接的标签
            data.data.forEach((link, index) => {
                console.log(`卡密链接 ${index + 1}:`, {
                    cardKey: link.cardKey,
                    appName: link.appName,
                    tags: link.tags
                });
            });
        } else {
            console.log('❌ 获取卡密链接列表失败:', data.message);
        }
    } catch (error) {
        console.error('❌ 请求失败:', error.message);
    }
}

/**
 * 测试无效标签格式
 */
async function testInvalidTags() {
    console.log('\n=== 测试无效标签格式 ===');

    const invalidTests = [
        {
            name: '标签不是数组',
            data: { appName: '测试应用', tags: '不是数组' }
        },
        {
            name: '空标签',
            data: { appName: '测试应用', tags: ['', '有效标签'] }
        },
        {
            name: '标签过长',
            data: { appName: '测试应用', tags: ['这是一个非常非常非常非常非常非常非常非常非常非常长的标签'] }
        }
    ];

    for (const test of invalidTests) {
        console.log(`\n测试: ${test.name}`);

        try {
            const response = await fetch('http://localhost:3000/api/user/cardlinks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-username': testUser.username,
                    'x-password': testUser.password
                },
                body: JSON.stringify(test.data)
            });

            const data = await response.json();
            console.log('状态码:', response.status);
            console.log('响应数据:', JSON.stringify(data, null, 2));

            if (!data.success) {
                console.log('✅ 验证失败（预期行为）:', data.message);
            } else {
                console.log('❌ 验证应该失败但成功了');
            }
        } catch (error) {
            console.error('❌ 请求失败:', error.message);
        }
    }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
    console.log('开始测试卡密链接标签功能...\n');

    await testCreateCardLinkWithTags();
    await testCreateCardLinkWithoutTags();
    await testGetCardLinks();
    await testInvalidTags();

    console.log('\n测试完成！');
}

// 运行测试
runAllTests().catch(console.error); 