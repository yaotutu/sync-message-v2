import { NextResponse } from 'next/server';
import { getUserByCardKey } from '@/lib/services/cardlinks';

/**
 * 根据卡密链接key获取用户广告设置
 * GET /api/public/user-ads-setting?cardKey=xxx
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const cardKey = searchParams.get('cardKey');

        // 验证参数
        if (!cardKey) {
            return NextResponse.json(
                { success: false, error: '缺少cardKey参数' },
                { status: 400 }
            );
        }

        // 查询用户信息
        const user = await getUserByCardKey(cardKey);

        if (!user) {
            return NextResponse.json(
                { success: false, error: '卡密链接不存在' },
                { status: 404 }
            );
        }

        // 返回用户广告设置
        return NextResponse.json({
            success: true,
            data: {
                showAds: user.showAds,
                showFooter: user.showFooter,
                username: user.username
            }
        });

    } catch (error) {
        console.error('获取用户广告设置失败:', error);
        return NextResponse.json(
            { success: false, error: '服务器内部错误' },
            { status: 500 }
        );
    }
} 