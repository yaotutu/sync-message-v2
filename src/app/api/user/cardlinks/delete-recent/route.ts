import { NextRequest, NextResponse } from 'next/server';
import { deleteRecentCardLinks } from '@/lib/services/cardlinks';

export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const auth = getUserAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: '需要认证' }, { status: 401 });
    }

    // 解析请求体
    const { count } = await request.json();
    if (!count || typeof count !== 'number' || count <= 0) {
      return NextResponse.json({ success: false, error: '无效的请求参数' }, { status: 400 });
    }

    // 调用服务层方法
    const { deletedCount } = await deleteRecentCardLinks(auth.username, count);

    return NextResponse.json({
      success: true,
      data: { deletedCount },
    });
  } catch (error) {
    console.error('删除最近卡密链接失败:', error);
    return NextResponse.json({ success: false, error: '服务器错误' }, { status: 500 });
  }
}

// 辅助函数 - 从请求中获取用户认证
function getUserAuthFromRequest(request: NextRequest) {
  const username = request.headers.get('x-username');
  const password = request.headers.get('x-password');

  return username && password ? { username, password } : null;
}
