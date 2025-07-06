import { NextResponse } from 'next/server';
import { updateUserProfile, validateUser } from '@/lib/services/users';

// 认证中间件
async function authenticate(request) {
  const username = request.headers.get('x-username');
  const password = request.headers.get('x-password');

  if (!username || !password) {
    return { error: NextResponse.json({ success: false, error: '需要认证' }, { status: 401 }) };
  }

  const validation = await validateUser(username, password);
  if (!validation.success) {
    return { error: NextResponse.json({ success: false, error: '认证失败' }, { status: 401 }) };
  }

  return { user: validation.data };
}

// 响应工具
function jsonResponse(success, data, error, status = 200) {
  return NextResponse.json({ success, data, error }, { status });
}

// 邮箱验证
function validateEmail(email) {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: '无效的邮箱格式' };
  }
  return { valid: true };
}

export async function GET(request) {
  const { error, user } = await authenticate(request);
  if (error) return error;

  return jsonResponse(true, { emails: user.emails || [] });
}

export async function POST(request) {
  const { error, user } = await authenticate(request);
  if (error) return error;

  try {
    const { email } = await request.json();
    const { error: emailError } = validateEmail(email);
    if (emailError) return jsonResponse(false, null, emailError, 400);

    const currentEmails = user.emails || [];
    if (currentEmails.includes(email)) {
      return jsonResponse(false, null, '该邮箱已绑定', 400);
    }

    const updatedEmails = [...currentEmails, email];
    const result = await updateUserProfile(user.username, { emails: updatedEmails });

    return result.success
      ? jsonResponse(true, { email, message: '邮箱绑定成功' })
      : jsonResponse(false, null, result.message || '绑定邮箱失败', 400);
  } catch (error) {
    console.error('绑定邮箱失败:', error);
    return jsonResponse(false, null, '服务器错误', 500);
  }
}

export async function DELETE(request) {
  const { error, user } = await authenticate(request);
  if (error) return error;

  try {
    const { email } = await request.json();
    if (!email) return jsonResponse(false, null, '需要指定要解绑的邮箱', 400);

    const currentEmails = user.emails || [];
    if (!currentEmails.includes(email)) {
      return jsonResponse(false, null, '该邮箱未绑定', 400);
    }

    const updatedEmails = currentEmails.filter((e) => e !== email);
    const result = await updateUserProfile(user.username, { emails: updatedEmails });

    return result?.success
      ? jsonResponse(true, { email, message: '邮箱解绑成功' })
      : jsonResponse(false, null, '解绑邮箱失败', 500);
  } catch (error) {
    console.error('解绑邮箱失败:', error);
    return jsonResponse(false, null, '服务器错误', 500);
  }
}
