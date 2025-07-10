/**
 * 测试消息来源类型筛选功能
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSourceTypeFilter() {
    console.log('开始测试消息来源类型筛选功能...');

    try {
        // 1. 测试查询所有消息
        console.log('\n1. 测试查询所有消息');
        const allMessages = await prisma.message.findMany({
            where: { username: 'aaa' },
            select: {
                id: true,
                sourceType: true,
                smsContent: true
            },
            orderBy: { systemReceivedAt: 'desc' },
            take: 10
        });
        console.log(`找到 ${allMessages.length} 条消息`);
        allMessages.forEach(msg => {
            console.log(`  - ID: ${msg.id}, 类型: ${msg.sourceType}, 内容: ${msg.smsContent?.substring(0, 30)}...`);
        });

        // 2. 测试筛选短信
        console.log('\n2. 测试筛选短信 (sourceType = "SMS")');
        const smsMessages = await prisma.message.findMany({
            where: { 
                username: 'aaa',
                sourceType: 'SMS'
            },
            select: {
                id: true,
                sourceType: true,
                smsContent: true
            },
            orderBy: { systemReceivedAt: 'desc' },
            take: 10
        });
        console.log(`找到 ${smsMessages.length} 条短信`);
        smsMessages.forEach(msg => {
            console.log(`  - ID: ${msg.id}, 类型: ${msg.sourceType}, 内容: ${msg.smsContent?.substring(0, 30)}...`);
        });

        // 3. 测试筛选邮件
        console.log('\n3. 测试筛选邮件 (sourceType = "EMAIL")');
        const emailMessages = await prisma.message.findMany({
            where: { 
                username: 'aaa',
                sourceType: 'EMAIL'
            },
            select: {
                id: true,
                sourceType: true,
                smsContent: true
            },
            orderBy: { systemReceivedAt: 'desc' },
            take: 10
        });
        console.log(`找到 ${emailMessages.length} 条邮件`);
        emailMessages.forEach(msg => {
            console.log(`  - ID: ${msg.id}, 类型: ${msg.sourceType}, 内容: ${msg.smsContent?.substring(0, 30)}...`);
        });

        // 4. 测试统计各类型消息数量
        console.log('\n4. 统计各类型消息数量');
        const smsCount = await prisma.message.count({
            where: { 
                username: 'aaa',
                sourceType: 'SMS'
            }
        });
        const emailCount = await prisma.message.count({
            where: { 
                username: 'aaa',
                sourceType: 'EMAIL'
            }
        });
        const totalCount = await prisma.message.count({
            where: { username: 'aaa' }
        });

        console.log(`  - 短信数量: ${smsCount}`);
        console.log(`  - 邮件数量: ${emailCount}`);
        console.log(`  - 总数量: ${totalCount}`);

        // 5. 测试结合搜索的筛选
        console.log('\n5. 测试结合搜索的筛选 (搜索"验证码"且类型为SMS)');
        const searchAndFilter = await prisma.message.findMany({
            where: { 
                username: 'aaa',
                sourceType: 'SMS',
                smsContent: { contains: 'Test' }
            },
            select: {
                id: true,
                sourceType: true,
                smsContent: true
            },
            orderBy: { systemReceivedAt: 'desc' },
            take: 5
        });
        console.log(`找到 ${searchAndFilter.length} 条包含"Test"的短信`);
        searchAndFilter.forEach(msg => {
            console.log(`  - ID: ${msg.id}, 类型: ${msg.sourceType}, 内容: ${msg.smsContent?.substring(0, 50)}...`);
        });

        console.log('\n✅ 消息来源类型筛选功能测试完成');

    } catch (error) {
        console.error('❌ 测试失败:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// 运行测试
testSourceTypeFilter();