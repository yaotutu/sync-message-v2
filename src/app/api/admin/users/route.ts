import { verifyAdminAuth } from '@/lib/services/auth';
import { getAllUsers, createUser } from '@/lib/services/users';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth?.success) {
      return NextResponse.json(
        { success: false, error: auth?.message || '需要管理员权限' },
        { status: 401 },
      );
    }

    const result = await getAllUsers();
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error('获取用户失败:', error);
    return NextResponse.json(
      { success: false, error: '获取用户列表失败，请稍后重试' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyAdminAuth(request);
    if (!auth?.success) {
      return NextResponse.json(
        { success: false, error: auth?.message || '需要管理员权限' },
        { status: 401 },
      );
    }

    const { username, password, canManageTemplates, showFooter, showAds } = await request.json();
    if (!username || !password) {
      return NextResponse.json({ success: false, error: '用户名和密码不能为空' }, { status: 400 });
    }

    console.log(`尝试创建用户: ${username}`);
    const result = await createUser(username, password, canManageTemplates, showFooter, showAds);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.message }, { status: 400 });
    }

    console.log(`用户创建成功: ${username}, ID: ${result.data?.id}`);
    return NextResponse.json(result);
  } catch (error) {
    console.error('创建用户失败:', error);
    return NextResponse.json(
      { success: false, error: '创建用户失败，请稍后重试' },
      { status: 500 },
    );
  }
}
