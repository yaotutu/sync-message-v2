/**
 * 筛选功能测试脚本
 * 测试状态筛选、标签筛选、模板筛选、搜索功能
 */

const BASE_URL = 'http://localhost:3000';

// 测试用户信息
const TEST_USER = {
    username: 'aaa',
    password: 'aaa'
};

// 测试数据
const TEST_DATA = {
    templates: [],
    userTags: [],
    cardLinks: []
};

/**
 * 通用API请求函数
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
        'Content-Type': 'application/json',
        'x-username': TEST_USER.username,
        'x-password': TEST_USER.password,
        ...options.headers
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers
        });
        return await response.json();
    } catch (error) {
        console.error(`API请求失败: ${endpoint}`, error);
        return { success: false, error: error.message };
    }
}

/**
 * 测试1: 获取模板列表
 */
async function testGetTemplates() {
    console.log('\n🧪 测试1: 获取模板列表');
    const result = await apiRequest('/api/templates');

    if (result.success) {
        TEST_DATA.templates = result.data || [];
        console.log(`✅ 成功获取 ${TEST_DATA.templates.length} 个模板`);
        TEST_DATA.templates.forEach(template => {
            console.log(`   - ${template.name} (ID: ${template.id})`);
        });
    } else {
        console.log(`❌ 获取模板失败: ${result.message}`);
    }

    return result.success;
}

/**
 * 测试2: 获取用户标签
 */
async function testGetUserTags() {
    console.log('\n🧪 测试2: 获取用户标签');
    const result = await apiRequest('/api/user/profile');

    if (result.success) {
        TEST_DATA.userTags = result.data.cardLinkTags || [];
        console.log(`✅ 成功获取 ${TEST_DATA.userTags.length} 个用户标签`);
        TEST_DATA.userTags.forEach(tag => {
            console.log(`   - ${tag}`);
        });
    } else {
        console.log(`❌ 获取用户标签失败: ${result.message}`);
    }

    return result.success;
}

/**
 * 测试3: 获取卡密链接列表（基础）
 */
async function testGetCardLinks() {
    console.log('\n🧪 测试3: 获取卡密链接列表（基础）');
    const result = await apiRequest('/api/user/cardlinks?page=1&pageSize=10');

    if (result.success) {
        TEST_DATA.cardLinks = result.data || [];
        console.log(`✅ 成功获取 ${TEST_DATA.cardLinks.length} 个卡密链接`);
        console.log(`   总数: ${result.pagination?.total || 0}`);

        if (TEST_DATA.cardLinks.length > 0) {
            const sample = TEST_DATA.cardLinks[0];
            console.log(`   示例链接: ${sample.appName} - ${sample.cardKey}`);
            console.log(`   模板ID: ${sample.templateId || '无'}`);
            console.log(`   标签: ${JSON.stringify(sample.tags || [])}`);
        }
    } else {
        console.log(`❌ 获取卡密链接失败: ${result.message}`);
    }

    return result.success;
}

/**
 * 测试4: 状态筛选测试
 */
async function testStatusFilter() {
    console.log('\n🧪 测试4: 状态筛选测试');

    const statusTests = [
        { status: 'all', name: '全部' },
        { status: 'unused', name: '未使用' },
        { status: 'used', name: '已使用' }
    ];

    for (const test of statusTests) {
        const result = await apiRequest(`/api/user/cardlinks?page=1&pageSize=5&status=${test.status}`);

        if (result.success) {
            console.log(`✅ ${test.name}状态筛选: 找到 ${result.data.length} 个结果`);
        } else {
            console.log(`❌ ${test.name}状态筛选失败: ${result.message}`);
        }
    }
}

/**
 * 测试5: 搜索功能测试
 */
async function testSearchFilter() {
    console.log('\n🧪 测试5: 搜索功能测试');

    if (TEST_DATA.cardLinks.length === 0) {
        console.log('⚠️  跳过搜索测试：没有可用的卡密链接');
        return;
    }

    const sampleLink = TEST_DATA.cardLinks[0];
    const searchTests = [
        { query: sampleLink.cardKey.substring(0, 4), name: '卡密前缀搜索' },
        { query: sampleLink.appName, name: '应用名称搜索' },
        { query: 'nonexistent', name: '不存在的搜索' }
    ];

    for (const test of searchTests) {
        const result = await apiRequest(`/api/user/cardlinks?page=1&pageSize=5&search=${encodeURIComponent(test.query)}`);

        if (result.success) {
            console.log(`✅ ${test.name}: 找到 ${result.data.length} 个结果`);
        } else {
            console.log(`❌ ${test.name}失败: ${result.message}`);
        }
    }
}

/**
 * 测试6: 标签筛选测试
 */
async function testTagFilter() {
    console.log('\n🧪 测试6: 标签筛选测试');

    if (TEST_DATA.userTags.length === 0) {
        console.log('⚠️  跳过标签筛选测试：用户没有标签');
        return;
    }

    const testTag = TEST_DATA.userTags[0];
    const result = await apiRequest(`/api/user/cardlinks?page=1&pageSize=5&tag=${encodeURIComponent(testTag)}`);

    if (result.success) {
        console.log(`✅ 标签筛选 (${testTag}): 找到 ${result.data.length} 个结果`);
    } else {
        console.log(`❌ 标签筛选失败: ${result.message}`);
    }
}

/**
 * 测试7: 模板筛选测试
 */
async function testTemplateFilter() {
    console.log('\n🧪 测试7: 模板筛选测试');

    if (TEST_DATA.templates.length === 0) {
        console.log('⚠️  跳过模板筛选测试：没有可用的模板');
        return;
    }

    const testTemplate = TEST_DATA.templates[0];
    const result = await apiRequest(`/api/user/cardlinks?page=1&pageSize=5&templateId=${testTemplate.id}`);

    if (result.success) {
        console.log(`✅ 模板筛选 (${testTemplate.name}): 找到 ${result.data.length} 个结果`);
    } else {
        console.log(`❌ 模板筛选失败: ${result.message}`);
    }
}

/**
 * 测试8: 组合筛选测试
 */
async function testCombinedFilter() {
    console.log('\n🧪 测试8: 组合筛选测试');

    const params = new URLSearchParams({
        page: '1',
        pageSize: '5',
        status: 'unused'
    });

    if (TEST_DATA.userTags.length > 0) {
        params.append('tag', TEST_DATA.userTags[0]);
    }

    if (TEST_DATA.templates.length > 0) {
        params.append('templateId', TEST_DATA.templates[0].id);
    }

    const result = await apiRequest(`/api/user/cardlinks?${params.toString()}`);

    if (result.success) {
        console.log(`✅ 组合筛选: 找到 ${result.data.length} 个结果`);
        console.log(`   筛选条件: ${params.toString()}`);
    } else {
        console.log(`❌ 组合筛选失败: ${result.message}`);
    }
}

/**
 * 测试9: 分页功能测试
 */
async function testPagination() {
    console.log('\n🧪 测试9: 分页功能测试');

    const pageTests = [
        { page: 1, name: '第一页' },
        { page: 2, name: '第二页' }
    ];

    for (const test of pageTests) {
        const result = await apiRequest(`/api/user/cardlinks?page=${test.page}&pageSize=3`);

        if (result.success) {
            console.log(`✅ ${test.name}: 获取 ${result.data.length} 个结果`);
            console.log(`   当前页: ${result.pagination?.page}, 总页数: ${result.pagination?.totalPages}`);
        } else {
            console.log(`❌ ${test.name}失败: ${result.message}`);
        }
    }
}

/**
 * 主测试函数
 */
async function runAllTests() {
    console.log('🚀 开始筛选功能测试...');
    console.log('='.repeat(50));

    try {
        // 基础数据获取
        await testGetTemplates();
        await testGetUserTags();
        await testGetCardLinks();

        // 筛选功能测试
        await testStatusFilter();
        await testSearchFilter();
        await testTagFilter();
        await testTemplateFilter();
        await testCombinedFilter();
        await testPagination();

        console.log('\n' + '='.repeat(50));
        console.log('🎉 所有测试完成！');

    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
    }
}

// 运行测试
runAllTests(); 