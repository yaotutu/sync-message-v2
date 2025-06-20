import { NextRequest, NextResponse } from 'next/server';
import { validateUser } from '@/lib/services/users';
import { getUserMessages } from '@/lib/services/messages';

/**
 * 获取用户消息
 */
export async function GET(request: NextRequest) {
  try {
    // 验证用户
    const username = request.headers.get('x-username');
    const password = request.headers.get('x-password');

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '请提供用户名和密码' },
        { status: 401 }
      );
    }

    const validateResult = await validateUser(username, password);
    if (!validateResult.success) {
      return NextResponse.json(validateResult, { status: 401 });
    }

    // 获取分页和搜索参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const search = url.searchParams.get('search');

    // 获取用户消息
    const result = await getUserMessages(
      username,
      page,
      pageSize,
      search || undefined
    );

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: {
        page,
        pageSize,
        total: result.total || 0,
        totalPages: Math.ceil((result.total || 0) / pageSize),
      },
    });
  } catch (error) {
    console.error('获取用户消息失败:', error);
    return NextResponse.json(
      { success: false, message: '获取消息失败' },
      { status: 500 }
    );
  }
}
