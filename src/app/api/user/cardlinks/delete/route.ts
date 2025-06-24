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

    const { keys } = await request.json();

    if (!keys || !Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json(
        { success: false, error: '请选择要删除的卡密链接' },
        { status: 400 },
      );
    }

    let deletedCount = 0;
    for (const key of keys) {
      const result = await prisma.cardLink.deleteMany({
        where: {
          username,
          key,
          firstUsedAt: null,
        },
      });
      deletedCount += result.count;
    }

    if (deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: '没有可删除的卡密链接或链接已被使用' },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { deletedCount },
    });
  } catch (error) {
    console.error('Delete card links error:', error);
    return NextResponse.json(
      { success: false, error: '删除卡密链接失败，请稍后重试' },
      { status: 500 },
    );
  }
}
