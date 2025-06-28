/**
 * 用户设置API测试
 */

// 测试用户信息
const testUser = {
    username: 'aaa',
    password: 'aaa'
};

// 测试数据
const testSettings = {
    cardLinkTags: ['工作', '重要', '紧急']
};

/**
 * 测试用户登录
 */
async function testUserLogin() {
    console.log('=== 测试用户登录 ===');

    try {
        const response = await fetch('http://localhost:3000/api/user/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testUser)
        });

        const data = await response.json();
        console.log('状态码:', response.status);
        console.log('响应数据:', JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('✅ 登录成功');
            console.log('卡密链接标签:', data.data.cardLinkTags);
            console.log('模板管理权限:', data.data.canManageTemplates);
        } else {
            console.log('❌ 登录失败:', data.message);
        }
    } catch (error) {
        console.error('❌ 请求失败:', error.message);
    }
}

/**
 * 测试获取用户信息
 */
async function testGetUserProfile() {
    console.log('\n=== 测试获取用户信息 ===');

    try {
        const response = await fetch('http://localhost:3000/api/user/profile', {
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
            console.log('✅ 获取用户信息成功');
            console.log('卡密链接标签:', data.data.cardLinkTags);
        } else {
            console.log('❌ 获取用户信息失败:', data.message);
        }
    } catch (error) {
        console.error('❌ 请求失败:', error.message);
    }
}

/**
 * 测试更新用户设置
 */
async function testUpdateUserSettings() {
    console.log('\n=== 测试更新用户设置 ===');

    try {
        const response = await fetch('http://localhost:3000/api/user/profile', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-username': testUser.username,
                'x-password': testUser.password
            },
            body: JSON.stringify(testSettings)
        });

        const data = await response.json();
        console.log('状态码:', response.status);
        console.log('响应数据:', JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('✅ 更新用户设置成功');
        } else {
            console.log('❌ 更新用户设置失败:', data.message);
        }
    } catch (error) {
        console.error('❌ 请求失败:', error.message);
    }
}

/**
 * 测试更新单个字段
 */
async function testUpdateSingleField() {
    console.log('\n=== 测试更新单个字段 ===');

    try {
        const response = await fetch('http://localhost:3000/api/user/profile', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-username': testUser.username,
                'x-password': testUser.password
            },
            body: JSON.stringify({
                cardLinkTags: ['新标签1', '新标签2']
            })
        });

        const data = await response.json();
        console.log('状态码:', response.status);
        console.log('响应数据:', JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('✅ 更新单个字段成功');
        } else {
            console.log('❌ 更新单个字段失败:', data.message);
        }
    } catch (error) {
        console.error('❌ 请求失败:', error.message);
    }
}

/**
 * 测试无效数据验证
 */
async function testInvalidDataValidation() {
    console.log('\n=== 测试无效数据验证 ===');

    const invalidTests = [
        {
            name: '无效标签格式',
            data: { cardLinkTags: '不是数组' }
        },
        {
            name: '空标签',
            data: { cardLinkTags: ['', '有效标签'] }
        },
        {
            name: '标签过长',
            data: { cardLinkTags: ['这是一个非常非常非常非常非常非常非常非常非常非常长的标签'] }
        }
    ];

    for (const test of invalidTests) {
        console.log(`\n测试: ${test.name}`);

        try {
            const response = await fetch('http://localhost:3000/api/user/profile', {
                method: 'PATCH',
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
 * 测试管理员创建用户
 */
async function testAdminCreateUser() {
    console.log('\n=== 测试管理员创建用户 ===');

    try {
        const response = await fetch('http://localhost:3000/api/admin/users', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-password': 'admin123'
            },
            body: JSON.stringify({
                username: 'testuser',
                password: 'testpass',
                canManageTemplates: false,
                cardLinkTags: ['测试用户'],
                showFooter: true,
                showAds: false
            })
        });

        const data = await response.json();
        console.log('状态码:', response.status);
        console.log('响应数据:', JSON.stringify(data, null, 2));

        if (data.success) {
            console.log('✅ 管理员创建用户成功');
        } else {
            console.log('❌ 管理员创建用户失败:', data.message);
        }
    } catch (error) {
        console.error('❌ 请求失败:', error.message);
    }
}

/**
 * 测试管理员控制显示设置
 */
async function testAdminControlDisplaySettings() {
    console.log('\n=== 测试管理员控制显示设置 ===');

    try {
        // 测试更新showFooter
        const response1 = await fetch('http://localhost:3000/api/admin/users/aaa', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-password': 'admin123'
            },
            body: JSON.stringify({
                showFooter: false
            })
        });

        const data1 = await response1.json();
        console.log('更新showFooter状态码:', response1.status);
        console.log('更新showFooter响应:', JSON.stringify(data1, null, 2));

        if (data1.success) {
            console.log('✅ 管理员更新showFooter成功');
        } else {
            console.log('❌ 管理员更新showFooter失败:', data1.message);
        }

        // 测试更新showAds
        const response2 = await fetch('http://localhost:3000/api/admin/users/aaa', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'x-admin-password': 'admin123'
            },
            body: JSON.stringify({
                showAds: false
            })
        });

        const data2 = await response2.json();
        console.log('更新showAds状态码:', response2.status);
        console.log('更新showAds响应:', JSON.stringify(data2, null, 2));

        if (data2.success) {
            console.log('✅ 管理员更新showAds成功');
        } else {
            console.log('❌ 管理员更新showAds失败:', data2.message);
        }
    } catch (error) {
        console.error('❌ 请求失败:', error.message);
    }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
    console.log('开始用户设置API测试...\n');

    // 1. 测试用户登录
    await testUserLogin();

    // 2. 获取用户信息
    await testGetUserProfile();

    // 3. 更新用户设置
    await testUpdateUserSettings();

    // 4. 再次获取用户信息验证更新
    await testGetUserProfile();

    // 5. 测试更新单个字段
    await testUpdateSingleField();

    // 6. 测试无效数据验证
    await testInvalidDataValidation();

    // 7. 测试管理员创建用户
    await testAdminCreateUser();

    // 8. 测试管理员控制显示设置
    await testAdminControlDisplaySettings();

    console.log('\n=== 测试完成 ===');
}

// 如果直接运行此文件，则执行测试
if (typeof window === 'undefined') {
    runAllTests().catch(console.error);
}

module.exports = {
    testUserLogin,
    testGetUserProfile,
    testUpdateUserSettings,
    testUpdateSingleField,
    testInvalidDataValidation,
    testAdminCreateUser,
    testAdminControlDisplaySettings,
    runAllTests
}; 