import { NextRequest, NextResponse } from 'next/server';
import { validateUser } from '@/lib/services/users';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const username = request.headers.get('x-username');
    const password = request.headers.get('x-password');

    if (!username || !password) {
      return NextResponse.json({ success: false, error: '需要用户认证' }, { status: 401 });
    }

    const auth = await validateUser(username, password);
    if (!auth.success) {
      return NextResponse.json(
        { success: false, error: auth.message || '用户认证失败' },
        { status: 401 },
      );
    }

    // 获取未使用的卡密链接数量
    const count = await prisma.cardLink.count({
      where: {
        username,
        firstUsedAt: null,
      },
    });

    if (count === 0) {
      return NextResponse.json(
        { success: false, error: '没有可删除的未使用卡密链接' },
        { status: 400 },
      );
    }

    // 删除所有未使用的卡密链接
    const result = await prisma.cardLink.deleteMany({
      where: {
        username,
        firstUsedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      data: { deletedCount: result.count },
    });
  } catch (error) {
    console.error('删除未使用卡密链接失败:', error);
    return NextResponse.json(
      { success: false, error: '删除未使用卡密链接失败，请稍后重试' },
      { status: 500 },
    );
  }
}
