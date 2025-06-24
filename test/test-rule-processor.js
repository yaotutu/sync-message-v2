/**
 * 规则处理器测试文件
 * 用于验证消息过滤规则是否符合预期
 */

// 模拟消息数据
const testMessages = [
    {
        id: 1,
        smsContent: "向日葵种子发芽了，长势很好",
        systemReceivedAt: Date.now()
    },
    {
        id: 2,
        smsContent: "向日葵密码重置成功，请及时修改",
        systemReceivedAt: Date.now()
    },
    {
        id: 3,
        smsContent: "向日葵很美，适合拍照",
        systemReceivedAt: Date.now()
    },
    {
        id: 4,
        smsContent: "其他普通消息",
        systemReceivedAt: Date.now()
    },
    {
        id: 5,
        smsContent: "密码验证失败，请重试",
        systemReceivedAt: Date.now()
    },
    {
        id: 6,
        smsContent: "向日葵验证码是123456",
        systemReceivedAt: Date.now()
    },
    {
        id: 7,
        smsContent: "向日葵广告推广信息",
        systemReceivedAt: Date.now()
    }
];

/**
 * 应用单个规则
 */
function applyRule(messages, rule) {
    console.log(`\n🔍 应用规则: ${rule.description || rule.mode}`);
    console.log(`   模式: ${rule.mode}, 匹配内容: "${rule.pattern}"`);
    console.log(`   过滤前消息数量: ${messages.length}`);

    let filteredMessages = [];

    try {
        switch (rule.mode) {
            case 'simple_include':
                // 必须包含指定文本
                filteredMessages = messages.filter(msg => msg.smsContent.includes(rule.pattern));
                break;

            case 'simple_exclude':
                // 不能包含指定文本
                filteredMessages = messages.filter(msg => !msg.smsContent.includes(rule.pattern));
                break;

            case 'regex':
                // 正则表达式匹配
                try {
                    const regex = new RegExp(rule.pattern, 'i');
                    filteredMessages = messages.filter(msg => regex.test(msg.smsContent));
                } catch (error) {
                    console.error(`❌ 正则表达式无效: ${rule.pattern}`, error);
                    return messages;
                }
                break;

            default:
                console.log(`❌ 未知规则模式: ${rule.mode}`);
                return messages;
        }

        console.log(`   过滤后消息数量: ${filteredMessages.length}`);

        // 显示过滤后的消息
        if (filteredMessages.length > 0) {
            console.log(`   ✅ 保留的消息:`);
            filteredMessages.forEach(msg => {
                console.log(`      - ${msg.smsContent}`);
            });
        } else {
            console.log(`   ❌ 没有消息符合条件`);
        }

        return filteredMessages;
    } catch (error) {
        console.error(`❌ 应用规则失败:`, error);
        return messages;
    }
}

/**
 * 规则管道处理
 */
function processMessagesWithRules(messages, rules) {
    console.log(`\n🚀 开始规则管道处理`);
    console.log(`原始消息数量: ${messages.length}`);
    console.log(`规则数量: ${rules.length}`);

    // 显示原始消息
    console.log(`\n📋 原始消息列表:`);
    messages.forEach(msg => {
        console.log(`   ${msg.id}. ${msg.smsContent}`);
    });

    // 按orderNum排序规则
    const sortedRules = rules.sort((a, b) => a.orderNum - b.orderNum);

    // 管道处理
    let processedMessages = [...messages];

    for (let i = 0; i < sortedRules.length; i++) {
        const rule = sortedRules[i];
        console.log(`\n📝 处理规则 ${i + 1}/${sortedRules.length}`);

        const beforeCount = processedMessages.length;
        processedMessages = applyRule(processedMessages, rule);
        const afterCount = processedMessages.length;

        if (afterCount < beforeCount) {
            console.log(`   ✅ 规则过滤成功: ${beforeCount} -> ${afterCount}`);
        } else {
            console.log(`   ⚠️  规则无匹配，跳过`);
        }

        // 如果没有消息了，提前结束
        if (processedMessages.length === 0) {
            console.log(`   🛑 所有消息已被过滤，提前结束`);
            break;
        }
    }

    console.log(`\n🎯 规则管道处理完成`);
    console.log(`最终消息数量: ${processedMessages.length}`);

    if (processedMessages.length > 0) {
        console.log(`\n📋 最终结果:`);
        processedMessages.forEach(msg => {
            console.log(`   ${msg.id}. ${msg.smsContent}`);
        });
    } else {
        console.log(`\n❌ 没有消息符合所有规则条件`);
    }

    return processedMessages;
}

/**
 * 测试用例
 */
function runTests() {
    console.log(`\n🧪 开始规则处理器测试\n`);
    console.log(`==========================================`);

    // 测试用例1: 必须包含"向日葵" + 不能包含"密码"
    console.log(`\n📋 测试用例1: 必须包含"向日葵" + 不能包含"密码"`);
    console.log(`预期结果: 包含向日葵且不包含密码的消息`);

    const testCase1 = [
        {
            id: 'rule1',
            mode: 'simple_include',
            pattern: '向日葵',
            description: '必须包含向日葵',
            orderNum: 1
        },
        {
            id: 'rule2',
            mode: 'simple_exclude',
            pattern: '密码',
            description: '不能包含密码',
            orderNum: 2
        }
    ];

    const result1 = processMessagesWithRules(testMessages, testCase1);

    // 验证结果
    const expected1 = testMessages.filter(msg =>
        msg.smsContent.includes('向日葵') && !msg.smsContent.includes('密码')
    );

    console.log(`\n✅ 验证结果:`);
    console.log(`预期消息数量: ${expected1.length}`);
    console.log(`实际消息数量: ${result1.length}`);
    console.log(`测试${result1.length === expected1.length ? '通过' : '失败'}`);

    console.log(`\n==========================================`);

    // 测试用例2: 必须包含"验证码" + 不能包含"广告"
    console.log(`\n📋 测试用例2: 必须包含"验证码" + 不能包含"广告"`);
    console.log(`预期结果: 包含验证码且不包含广告的消息`);

    const testCase2 = [
        {
            id: 'rule1',
            mode: 'simple_include',
            pattern: '验证码',
            description: '必须包含验证码',
            orderNum: 1
        },
        {
            id: 'rule2',
            mode: 'simple_exclude',
            pattern: '广告',
            description: '不能包含广告',
            orderNum: 2
        }
    ];

    const result2 = processMessagesWithRules(testMessages, testCase2);

    // 验证结果
    const expected2 = testMessages.filter(msg =>
        msg.smsContent.includes('验证码') && !msg.smsContent.includes('广告')
    );

    console.log(`\n✅ 验证结果:`);
    console.log(`预期消息数量: ${expected2.length}`);
    console.log(`实际消息数量: ${result2.length}`);
    console.log(`测试${result2.length === expected2.length ? '通过' : '失败'}`);

    console.log(`\n==========================================`);

    // 测试用例3: 正则表达式测试
    console.log(`\n📋 测试用例3: 正则表达式 - 以"向日葵"开头`);
    console.log(`预期结果: 以向日葵开头的消息`);

    const testCase3 = [
        {
            id: 'rule1',
            mode: 'regex',
            pattern: '^向日葵',
            description: '以向日葵开头',
            orderNum: 1
        }
    ];

    const result3 = processMessagesWithRules(testMessages, testCase3);

    // 验证结果
    const expected3 = testMessages.filter(msg =>
        /^向日葵/i.test(msg.smsContent)
    );

    console.log(`\n✅ 验证结果:`);
    console.log(`预期消息数量: ${expected3.length}`);
    console.log(`实际消息数量: ${result3.length}`);
    console.log(`测试${result3.length === expected3.length ? '通过' : '失败'}`);

    console.log(`\n==========================================`);

    // 测试用例4: 复杂组合规则
    console.log(`\n📋 测试用例4: 复杂组合 - 包含"向日葵" + 不包含"密码" + 不包含"广告"`);
    console.log(`预期结果: 包含向日葵且不包含密码和广告的消息`);

    const testCase4 = [
        {
            id: 'rule1',
            mode: 'simple_include',
            pattern: '向日葵',
            description: '必须包含向日葵',
            orderNum: 1
        },
        {
            id: 'rule2',
            mode: 'simple_exclude',
            pattern: '密码',
            description: '不能包含密码',
            orderNum: 2
        },
        {
            id: 'rule3',
            mode: 'simple_exclude',
            pattern: '广告',
            description: '不能包含广告',
            orderNum: 3
        }
    ];

    const result4 = processMessagesWithRules(testMessages, testCase4);

    // 验证结果
    const expected4 = testMessages.filter(msg =>
        msg.smsContent.includes('向日葵') &&
        !msg.smsContent.includes('密码') &&
        !msg.smsContent.includes('广告')
    );

    console.log(`\n✅ 验证结果:`);
    console.log(`预期消息数量: ${expected4.length}`);
    console.log(`实际消息数量: ${result4.length}`);
    console.log(`测试${result4.length === expected4.length ? '通过' : '失败'}`);

    console.log(`\n==========================================`);
    console.log(`\n🎉 所有测试完成！`);
}

// 运行测试
runTests(); 