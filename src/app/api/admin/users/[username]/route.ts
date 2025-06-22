import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/services/auth';
import { deleteUser, updateUser } from '@/lib/services/users';

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth?.success) {
      return NextResponse.json(
        { success: false, error: auth?.message || '需要管理员权限' },
        { status: 401 },
      );
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

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth?.success) {
      return NextResponse.json(
        { success: false, error: auth?.message || '需要管理员权限' },
        { status: 401 },
      );
    }

    const username = request.nextUrl.pathname.split('/').pop();
    if (!username) {
      return NextResponse.json({ success: false, error: '用户名不能为空' }, { status: 400 });
    }

    const body = await request.json();
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json({ success: false, error: '请求体不能为空' }, { status: 400 });
    }

    console.log(`尝试更新用户: ${username}`, body);
    const result = await updateUser(username, body);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('更新用户失败:', error);
    return NextResponse.json(
      { success: false, error: '更新用户失败，请稍后重试' },
      { status: 500 },
    );
  }
}
