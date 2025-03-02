import { NextRequest, NextResponse } from 'next/server';
import { getAllCardLinks } from '@/lib/db/cardlinks';
import { verifyAdminAuth } from '@/lib/services/auth';

/**
 * 获取所有卡密链接 (管理员API)
 */
export async function GET(request: NextRequest) {
    try {
        console.log('收到管理员获取所有卡密链接请求');

        // 验证管理员权限
        const authResult = verifyAdminAuth(request);
        if (!authResult.success) {
            console.log('错误: 管理员验证失败');
            return NextResponse.json(
                { success: false, message: '未授权访问' },
                { status: 401 }
            );
        }

        // 获取查询参数
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');
        const appName = searchParams.get('appName');

        console.log(`查询参数: username=${username || '未指定'}, appName=${appName || '未指定'}`);

        // 获取所有卡密链接
        const allCardLinks = await getAllCardLinks();
        console.log(`成功获取 ${allCardLinks.length} 个卡密链接`);

        // 根据查询参数过滤
        let cardLinks = allCardLinks;

        if (username) {
            console.log(`过滤用户: ${username}`);
            cardLinks = cardLinks.filter(link => link.username === username);
            console.log(`过滤后剩余 ${cardLinks.length} 个卡密链接`);
        }

        if (appName) {
            console.log(`过滤应用: ${appName}`);
            cardLinks = cardLinks.filter(link => link.appName === appName);
            console.log(`过滤后剩余 ${cardLinks.length} 个卡密链接`);
        }

        // 统计应用分布
        if (cardLinks.length > 0) {
            const appCounts = new Map<string, number>();
            cardLinks.forEach(link => {
                if (link.appName) {
                    const count = appCounts.get(link.appName) || 0;
                    appCounts.set(link.appName, count + 1);
                }
            });

            console.log('卡密链接应用分布:');
            Array.from(appCounts.entries()).forEach(([app, count]) => {
                console.log(`  - ${app}: ${count}个链接`);
            });
        }

        return NextResponse.json({
            success: true,
            data: cardLinks
        });
    } catch (error) {
        console.error('获取所有卡密链接失败:', error);
        return NextResponse.json(
            { success: false, message: '获取卡密链接失败' },
            { status: 500 }
        );
    }
} 