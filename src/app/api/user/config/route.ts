import { NextResponse } from 'next/server';
import { validateUser } from '@/lib/services/users';

// 从请求中获取用户认证信息
function getUserAuthFromRequest(request: Request) {
    const username = request.headers.get('x-username');
    const password = request.headers.get('x-password');

    return username && password ? { username, password } : null;
}

export async function GET(request: Request) {
    try {
        // 1. 认证验证
        const auth = getUserAuthFromRequest(request);
        if (!auth) {
            return NextResponse.json(
                { success: false, error: '需要认证' },
                { status: 401 }
            );
        }

        // 2. 验证用户
        const userValidation = await validateUser(auth.username, auth.password);
        if (!userValidation.success) {
            return NextResponse.json(
                { success: false, error: '认证失败' },
                { status: 401 }
            );
        }

        const user = userValidation.data;

        // 3. 生成配置文件
        const config = {
            username: user.username,
            webhookKey: user.webhookKey || '',
            smsContent: "{{MSG}}",
            sourceType: "SMS",
            smsReceivedAt: "{{RECEIVE_TIME}}",
            timeFormat: "iso",
            senderPhone: "{{CARD_SLOT}}"
        };

        // 4. 返回结果
        return NextResponse.json({
            success: true,
            data: {
                config,
                configJson: JSON.stringify(config, null, 2)
            }
        });

    } catch (error) {
        console.error('获取配置文件失败:', error);
        return NextResponse.json(
            { success: false, error: '服务器内部错误' },
            { status: 500 }
        );
    }
} 