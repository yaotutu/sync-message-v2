import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/services/auth';
import { deleteUser } from '@/lib/services/users';

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth) {
      return NextResponse.json({ success: false, error: '需要管理员认证' }, { status: 401 });
    }

    const username = request.nextUrl.pathname.split('/').pop();
    if (!username) {
      return NextResponse.json({ success: false, error: '用户名不能为空' }, { status: 400 });
    }

    console.log(`尝试删除用户: ${username}`);
    const result = await deleteUser(username);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json(
      { success: false, error: '删除用户失败，请稍后重试' },
      { status: 500 },
    );
  }
}
