/**
 * 测试API层的sourceType筛选功能
 */

async function testAPIFilter() {
    console.log('开始测试API层的sourceType筛选功能...');

    const baseUrl = 'http://localhost:3000';
    
    // 测试用户凭据 (需要根据实际情况调整)
    const headers = {
        'x-username': 'aaa',
        'x-password': 'aaa',
        'Content-Type': 'application/json'
    };

    try {
        // 1. 测试获取所有消息
        console.log('\n1. 测试获取所有消息');
        let response = await fetch(`${baseUrl}/api/user/messages?page=1&pageSize=10`, {
            method: 'GET',
            headers: headers
        });
        let data = await response.json();
        console.log(`状态: ${response.status}, 成功: ${data.success}`);
        if (data.success) {
            console.log(`总数: ${data.pagination?.total || 0} 条消息`);
            console.log(`当前页: ${data.data?.length || 0} 条消息`);
        }

        // 2. 测试筛选短信
        console.log('\n2. 测试筛选短信 (sourceType=sms)');
        response = await fetch(`${baseUrl}/api/user/messages?page=1&pageSize=10&sourceType=sms`, {
            method: 'GET',
            headers: headers
        });
        data = await response.json();
        console.log(`状态: ${response.status}, 成功: ${data.success}`);
        if (data.success) {
            console.log(`短信数量: ${data.pagination?.total || 0} 条`);
            console.log(`当前页: ${data.data?.length || 0} 条`);
        }

        // 3. 测试筛选邮件
        console.log('\n3. 测试筛选邮件 (sourceType=email)');
        response = await fetch(`${baseUrl}/api/user/messages?page=1&pageSize=10&sourceType=email`, {
            method: 'GET',
            headers: headers
        });
        data = await response.json();
        console.log(`状态: ${response.status}, 成功: ${data.success}`);
        if (data.success) {
            console.log(`邮件数量: ${data.pagination?.total || 0} 条`);
            console.log(`当前页: ${data.data?.length || 0} 条`);
            // 显示前几条邮件的类型验证
            if (data.data && data.data.length > 0) {
                console.log('前3条邮件验证:');
                data.data.slice(0, 3).forEach((msg, index) => {
                    console.log(`  ${index + 1}. ID: ${msg.id}, 类型: ${msg.sourceType}`);
                });
            }
        }

        // 4. 测试组合筛选：搜索+类型筛选
        console.log('\n4. 测试组合筛选 (搜索"Test"且类型为email)');
        response = await fetch(`${baseUrl}/api/user/messages?page=1&pageSize=5&search=Test&sourceType=email`, {
            method: 'GET',
            headers: headers
        });
        data = await response.json();
        console.log(`状态: ${response.status}, 成功: ${data.success}`);
        if (data.success) {
            console.log(`包含"Test"的邮件数量: ${data.pagination?.total || 0} 条`);
            console.log(`当前页: ${data.data?.length || 0} 条`);
        }

        console.log('\n✅ API层sourceType筛选功能测试完成');

    } catch (error) {
        console.error('❌ API测试失败:', error.message);
    }
}

// 运行测试
testAPIFilter();