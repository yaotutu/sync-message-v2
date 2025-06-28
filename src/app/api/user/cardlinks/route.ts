import { NextRequest, NextResponse } from 'next/server';
import { validateUser } from '@/lib/services/users';
import { createCardLink } from '@/lib/services/cardlinks';
import { CreateCardLinkDTO, CardLinkResponseDTO } from '@/types';
import { getTemplateById } from '@/lib/services/templates';
import { getUserCardLinks } from '@/lib/db/cardlinks';

/**
 * 获取用户的卡密链接
 */
export async function GET(request: NextRequest) {
  try {
    console.log('收到获取用户卡密链接请求');

    // 获取用户名和密码
    const username = request.headers.get('x-username');
    const password = request.headers.get('x-password');
    console.log(`请求头: username=${username}, password=${password ? '已提供' : '未提供'}`);

    if (!username || !password) {
      console.log('错误: 缺少用户名或密码');
      return NextResponse.json({ success: false, message: '请提供用户名和密码' }, { status: 401 });
    }

    // 验证用户
    const validateResult = await validateUser(username, password);
    if (!validateResult.success) {
      console.log(`错误: 用户验证失败，用户: ${username}`);
      return NextResponse.json(validateResult, { status: 401 });
    }
    console.log(`用户验证成功: ${username}`);

    // 获取分页参数
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    // 获取状态过滤参数
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const tag = url.searchParams.get('tag');
    const templateId = url.searchParams.get('templateId');

    console.log(
      `分页参数: page=${page}, pageSize=${pageSize}, status=${status || '全部'}, search=${search || '无'}, tag=${tag || '无'}, templateId=${templateId || '无'}`,
    );

    // 获取用户的卡密链接
    const { links, total } = await getUserCardLinks(username, page, pageSize, status, search, tag, templateId);
    console.log(`成功获取用户 ${username} 的 ${links.length} 个卡密链接，总数: ${total}`);

    return NextResponse.json({
      success: true,
      data: links,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('获取用户卡密链接失败:', error);
    return NextResponse.json({ success: false, message: '获取卡密链接失败' }, { status: 500 });
  }
}

/**
 * 创建新的卡密链接
 */
export async function POST(request: NextRequest) {
  try {
    console.log('收到创建卡密链接请求');

    // 获取用户名和密码
    const username = request.headers.get('x-username');
    const password = request.headers.get('x-password');
    console.log(`请求头: username=${username}, password=${password ? '已提供' : '未提供'}`);

    if (!username || !password) {
      console.log('错误: 缺少用户名或密码');
      return NextResponse.json({ success: false, message: '请提供用户名和密码' }, { status: 401 });
    }

    // 验证用户
    const validateResult = await validateUser(username, password);
    if (!validateResult.success) {
      console.log(`错误: 用户验证失败，用户: ${username}`);
      return NextResponse.json(validateResult, { status: 401 });
    }
    console.log(`用户验证成功: ${username}`);

    // 解析请求体
    const data: CreateCardLinkDTO = await request.json();
    console.log(
      `请求参数: appName=${data.appName}, phone=${data.phone || '未提供'}, templateId=${data.templateId || '未提供'}, expiryDays=${data.expiryDays || '未提供'}, tags=${data.tags ? JSON.stringify(data.tags) : '未提供'}`,
    );

    // 验证必填字段
    if (!data.appName) {
      console.log('错误: 应用名称为空');
      return NextResponse.json({ success: false, message: '应用名称不能为空' }, { status: 400 });
    }

    // 处理手机号
    let phone = null;
    if (data.phone) {
      const phoneStr = data.phone.trim();
      if (phoneStr && /^1\d{10}$/.test(phoneStr)) {
        phone = phoneStr;
        console.log(`有效手机号: ${phone}`);
      } else {
        console.log('错误: 无效的手机号格式');
        return NextResponse.json(
          { success: false, message: '请提供有效的手机号（11位数字，以1开头）' },
          { status: 400 },
        );
      }
    } else {
      console.log('未提供手机号，将创建不带手机号的卡密链接');
    }

    // 验证标签
    let tags: string[] = [];
    if (data.tags) {
      if (!Array.isArray(data.tags)) {
        console.log('错误: 标签必须是数组格式');
        return NextResponse.json({ success: false, message: '标签必须是数组格式' }, { status: 400 });
      }

      // 验证标签内容
      for (const tag of data.tags) {
        if (typeof tag !== 'string' || tag.trim().length === 0) {
          console.log('错误: 标签不能为空');
          return NextResponse.json({ success: false, message: '标签不能为空' }, { status: 400 });
        }
        if (tag.length > 50) {
          console.log('错误: 标签长度不能超过50个字符');
          return NextResponse.json({ success: false, message: '标签长度不能超过50个字符' }, { status: 400 });
        }
      }
      tags = data.tags;
      console.log(`使用标签: ${JSON.stringify(tags)}`);
    }

    // 如果提供了模板ID，获取模板信息
    let templateName = '';
    if (data.templateId) {
      console.log(`尝试获取模板: ${data.templateId}`);
      const template = await getTemplateById(data.templateId);
      if (!template) {
        console.log(`错误: 模板不存在 - ${data.templateId}`);
        return NextResponse.json({ success: false, message: '指定的模板不存在' }, { status: 400 });
      }
      templateName = template.name;
      console.log(`使用模板: ${templateName}`);
    }

    // 创建卡链接
    console.log(
      `尝试创建卡密链接: 用户=${username}, 应用=${templateName || data.appName}, 手机号=${phone || '无'}, 过期天数=${data.expiryDays || '无'}, 标签=${JSON.stringify(tags)}`,
    );
    const cardLink = await createCardLink(username, {
      appName: templateName || data.appName,
      phone: phone || undefined,
      templateId: data.templateId,
      expiryDays: data.expiryDays,
      tags,
    });
    console.log(`卡密链接创建成功: cardKey=${cardLink.cardKey}, url=${cardLink.url}`);

    return NextResponse.json({ success: true, data: cardLink });
  } catch (error) {
    console.error('创建卡密链接失败:', error);
    return NextResponse.json(
      { success: false, message: '创建卡密链接失败，请稍后重试' },
      { status: 500 },
    );
  }
}
