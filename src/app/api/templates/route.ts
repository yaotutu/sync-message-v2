import { NextRequest, NextResponse } from 'next/server';
import { verifyTemplateAccess } from '@/lib/services/auth';
import {
  getAllTemplates,
  createTemplate,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
} from '@/lib/services/templates';
import { CreateTemplateDTO, UpdateTemplateDTO } from '@/types/index';

/**
 * 获取所有模板
 */
export async function GET(request: NextRequest) {
  try {
    // 验证权限
    const authResult = await verifyTemplateAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, message: '未授权访问' }, { status: 401 });
    }

    // 获取所有模板
    const templates = await getAllTemplates(authResult.username);
    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error('获取模板失败:', error);
    return NextResponse.json({ success: false, message: '获取模板失败' }, { status: 500 });
  }
}

/**
 * 创建模板
 */
export async function POST(request: NextRequest) {
  try {
    // 验证权限
    const authResult = await verifyTemplateAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, message: '未授权访问' }, { status: 401 });
    }

    // 解析请求体
    const data = (await request.json()) as CreateTemplateDTO;

    // 验证必填字段
    if (!data.name) {
      return NextResponse.json({ success: false, message: '模板名称不能为空' }, { status: 400 });
    }

    // 创建模板
    const template = await createTemplate({
      ...data,
      username: authResult.username,
      rules: data.rules || [],
    });
    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error('创建模板失败:', error);
    return NextResponse.json({ success: false, message: '创建模板失败' }, { status: 500 });
  }
}

/**
 * 更新模板
 */
export async function PATCH(request: NextRequest) {
  try {
    // 验证权限
    const authResult = await verifyTemplateAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, message: '未授权访问' }, { status: 401 });
    }

    // 解析请求体
    const data = (await request.json()) as UpdateTemplateDTO;

    // 验证必填字段
    if (!data.id) {
      return NextResponse.json({ success: false, message: '模板ID不能为空' }, { status: 400 });
    }

    // 更新模板
    const template = await updateTemplate(data.id, {
      ...data,
      username: authResult.username,
      rules: data.rules || [],
    });
    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error('更新模板失败:', error);
    return NextResponse.json({ success: false, message: '更新模板失败' }, { status: 500 });
  }
}

/**
 * 删除模板
 */
export async function DELETE(request: NextRequest) {
  try {
    // 验证权限
    const authResult = await verifyTemplateAccess(request);
    if (!authResult.success) {
      return NextResponse.json({ success: false, message: '未授权访问' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: '模板ID不能为空' }, { status: 400 });
    }

    // 删除模板
    await deleteTemplate(id, authResult.username);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除模板失败:', error);
    return NextResponse.json({ success: false, message: '删除模板失败' }, { status: 500 });
  }
}
