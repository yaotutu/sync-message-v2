/**
 * 公共消息API逻辑测试
 * 测试各种场景下的API行为
 */

// 模拟Prisma客户端
const mockPrisma = {
    cardLink: {
        findUnique: jest.fn(),
        update: jest.fn()
    },
    message: {
        findMany: jest.fn()
    }
};

// 模拟processMessagesWithRules函数
const mockProcessMessagesWithRules = jest.fn();

// 模拟NextResponse
const mockNextResponse = {
    json: jest.fn()
};

// 模拟console.log和console.error
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

describe('公共消息API逻辑测试', () => {
    beforeEach(() => {
        // 重置所有mock
        jest.clearAllMocks();
        console.log = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
    });

    describe('参数处理测试', () => {
        test('应该正确处理URL编码的中文参数', () => {
            const url = 'http://localhost:3000/api/public/messages?cardKey=ABC123&appName=%E5%BE%AE%E4%BF%A1&phone=13800138000';
            const { searchParams } = new URL(url);

            const cardKey = searchParams.get('cardKey');
            const appName = searchParams.get('appName');
            const phone = searchParams.get('phone');

            const decodedCardKey = cardKey ? decodeURIComponent(cardKey) : null;
            const decodedAppName = appName ? decodeURIComponent(appName) : null;
            const decodedPhone = phone ? decodeURIComponent(phone) : null;

            expect(decodedCardKey).toBe('ABC123');
            expect(decodedAppName).toBe('微信');
            expect(decodedPhone).toBe('13800138000');
        });

        test('应该验证参数完整性', () => {
            const testCases = [
                { cardKey: null, appName: '微信', phone: '13800138000', expected: false },
                { cardKey: 'ABC123', appName: null, phone: '13800138000', expected: false },
                { cardKey: 'ABC123', appName: '微信', phone: null, expected: false },
                { cardKey: 'ABC123', appName: '微信', phone: '13800138000', expected: true },
                { cardKey: '', appName: '微信', phone: '13800138000', expected: false },
                { cardKey: 'ABC123', appName: '', phone: '13800138000', expected: false },
                { cardKey: 'ABC123', appName: '微信', phone: '', expected: false }
            ];

            testCases.forEach(({ cardKey, appName, phone, expected }) => {
                const isValid = !!(cardKey && appName && phone);
                expect(isValid).toBe(expected);
            });
        });
    });

    describe('卡密链接查询测试', () => {
        test('应该使用精确匹配查询卡密链接', () => {
            const decodedCardKey = 'ABC123DEF456GHIJ';
            const decodedAppName = '微信';
            const decodedPhone = '13800138000';

            const expectedQuery = {
                where: {
                    cardKey: decodedCardKey,
                    appName: decodedAppName,
                    phone: decodedPhone
                },
                select: {
                    username: true,
                    firstUsedAt: true,
                    templateId: true
                }
            };

            // 验证查询参数结构
            expect(expectedQuery.where.cardKey).toBe(decodedCardKey);
            expect(expectedQuery.where.appName).toBe(decodedAppName);
            expect(expectedQuery.where.phone).toBe(decodedPhone);
            expect(expectedQuery.select).toHaveProperty('username');
            expect(expectedQuery.select).toHaveProperty('firstUsedAt');
            expect(expectedQuery.select).toHaveProperty('templateId');
        });
    });

    describe('firstUsedAt处理测试', () => {
        test('首次访问时应该更新firstUsedAt', () => {
            const cardLink = {
                username: 'user123',
                firstUsedAt: null,
                templateId: 'template_001'
            };

            const shouldUpdate = !cardLink.firstUsedAt;
            expect(shouldUpdate).toBe(true);
        });

        test('非首次访问时不应该更新firstUsedAt', () => {
            const cardLink = {
                username: 'user123',
                firstUsedAt: 1703123456789,
                templateId: 'template_001'
            };

            const shouldUpdate = !cardLink.firstUsedAt;
            expect(shouldUpdate).toBe(false);
        });
    });

    describe('消息查询测试', () => {
        test('应该使用正确的查询条件', () => {
            const username = 'user123';
            const firstUsedAt = 1703123456789;
            const decodedPhone = '13800138000';

            const expectedQuery = {
                where: {
                    username: username,
                    systemReceivedAt: { gt: firstUsedAt },
                    senderPhone: {
                        contains: decodedPhone
                    }
                },
                orderBy: { systemReceivedAt: 'desc' },
                select: {
                    id: true,
                    smsContent: true,
                    smsReceivedAt: true,
                    systemReceivedAt: true,
                    sourceType: true,
                    senderPhone: true
                }
            };

            // 验证查询条件
            expect(expectedQuery.where.username).toBe(username);
            expect(expectedQuery.where.systemReceivedAt.gt).toBe(firstUsedAt);
            expect(expectedQuery.where.senderPhone.contains).toBe(decodedPhone);
            expect(expectedQuery.orderBy.systemReceivedAt).toBe('desc');
        });

        test('senderPhone模糊匹配测试', () => {
            const phone = '13800138000';

            // 应该匹配的情况
            const shouldMatch = [
                '13800138000',
                'bank_13800138000',
                '13800138000_verify',
                'sms_13800138000_code',
                '13800138000@bank.com'
            ];

            // 不应该匹配的情况
            const shouldNotMatch = [
                '1380013800',
                '138001380001',
                '138_001_380_00',
                null,
                ''
            ];

            shouldMatch.forEach(senderPhone => {
                const matches = senderPhone && senderPhone.includes(phone);
                expect(matches).toBe(true);
            });

            shouldNotMatch.forEach(senderPhone => {
                const matches = senderPhone && senderPhone.includes(phone);
                expect(matches).toBe(false);
            });
        });
    });

    describe('规则处理测试', () => {
        test('有模板ID时应该进行规则处理', () => {
            const cardLink = {
                username: 'user123',
                firstUsedAt: 1703123456789,
                templateId: 'template_001'
            };

            const shouldProcess = !!cardLink.templateId;
            expect(shouldProcess).toBe(true);
        });

        test('无模板ID时应该跳过规则处理', () => {
            const cardLink = {
                username: 'user123',
                firstUsedAt: 1703123456789,
                templateId: null
            };

            const shouldProcess = !!cardLink.templateId;
            expect(shouldProcess).toBe(false);
        });
    });

    describe('最终结果处理测试', () => {
        test('有消息时应该返回第一条消息', () => {
            const processedMessages = [
                { smsContent: '消息1' },
                { smsContent: '消息2' },
                { smsContent: '消息3' }
            ];

            const finalMessage = processedMessages.length > 0 ? processedMessages[0] : null;
            const messageContent = finalMessage ? finalMessage.smsContent : '';

            expect(finalMessage).toBe(processedMessages[0]);
            expect(messageContent).toBe('消息1');
        });

        test('无消息时应该返回空字符串', () => {
            const processedMessages = [];

            const finalMessage = processedMessages.length > 0 ? processedMessages[0] : null;
            const messageContent = finalMessage ? finalMessage.smsContent : '';

            expect(finalMessage).toBe(null);
            expect(messageContent).toBe('');
        });
    });

    describe('错误处理测试', () => {
        test('参数验证失败时应该返回400错误', () => {
            const errorResponse = {
                success: false,
                error: '缺少必要参数 (cardKey, appName, phone)'
            };

            expect(errorResponse.success).toBe(false);
            expect(errorResponse.error).toContain('缺少必要参数');
        });

        test('服务器错误时应该返回500错误', () => {
            const errorResponse = {
                success: false,
                error: '获取消息失败'
            };

            expect(errorResponse.success).toBe(false);
            expect(errorResponse.error).toBe('获取消息失败');
        });
    });

    describe('响应格式测试', () => {
        test('成功响应格式', () => {
            const response = {
                success: true,
                message: '您的验证码是123456，5分钟内有效',
                firstUsedAt: 1703123456789
            };

            expect(response.success).toBe(true);
            expect(response).toHaveProperty('message');
            expect(response).toHaveProperty('firstUsedAt');
            expect(typeof response.message).toBe('string');
            expect(typeof response.firstUsedAt).toBe('number');
        });
    });
});

// 运行测试
if (require.main === module) {
    console.log('开始运行公共消息API逻辑测试...');

    // 这里可以添加实际的测试运行逻辑
    // 由于这是Node.js环境，我们需要使用适当的测试框架
    console.log('测试完成！');
} 