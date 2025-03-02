import { NextRequest, NextResponse } from 'next/server';
import { validateUser } from '@/lib/services/users';
import { createCardLink } from '@/lib/services/cardlinks';
import { CreateCardLinkDTO } from '@/types';
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
            return NextResponse.json(
                { success: false, message: '请提供用户名和密码' },
                { status: 401 }
            );
        }

        // 验证用户
        const validateResult = await validateUser(username, password);
        if (!validateResult.success) {
            console.log(`错误: 用户验证失败，用户: ${username}`);
            return NextResponse.json(validateResult, { status: 401 });
        }
        console.log(`用户验证成功: ${username}`);

        // 获取用户的卡密链接
        const cardLinks = await getUserCardLinks(username);
        console.log(`成功获取用户 ${username} 的 ${cardLinks.length} 个卡密链接`);

        return NextResponse.json({
            success: true,
            data: cardLinks
        });
    } catch (error) {
        console.error('获取用户卡密链接失败:', error);
        return NextResponse.json(
            { success: false, message: '获取卡密链接失败' },
            { status: 500 }
        );
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
            return NextResponse.json(
                { success: false, message: '请提供用户名和密码' },
                { status: 401 }
            );
        }

        // 验证用户
        const validateResult = await validateUser(username, password);
        if (!validateResult.success) {
            console.log(`错误: 用户验证失败，用户: ${username}`);
            return NextResponse.json(validateResult, { status: 401 });
        }
        console.log(`用户验证成功: ${username}`);

        // 解析请求体
        const data = await request.json();
        console.log(`请求参数: appName=${data.appName}, phones=${data.phones?.length || 0}个, phoneNumbers=${data.phoneNumbers?.length || 0}个, templateId=${data.templateId || '未提供'}`);

        // 验证必填字段
        if (!data.appName) {
            console.log('错误: 应用名称为空');
            return NextResponse.json(
                { success: false, message: '应用名称不能为空' },
                { status: 400 }
            );
        }

        // 处理手机号，支持phones和phoneNumbers两个字段
        let phones: string[] = [];
        if (data.phones) {
            phones = Array.isArray(data.phones) ? data.phones : [data.phones];
        } else if (data.phoneNumbers) {
            phones = Array.isArray(data.phoneNumbers) ? data.phoneNumbers : [data.phoneNumbers];
        }

        // 验证手机号
        if (phones.length === 0) {
            console.log('错误: 未提供手机号');
            return NextResponse.json(
                { success: false, message: '请至少提供一个手机号' },
                { status: 400 }
            );
        }

        // 验证手机号格式
        const validPhones = phones.filter((phone: string) => phone.trim() && /^1\d{10}$/.test(phone));
        if (validPhones.length === 0) {
            console.log('错误: 无有效手机号');
            return NextResponse.json(
                { success: false, message: '请提供有效的手机号（11位数字，以1开头）' },
                { status: 400 }
            );
        }
        console.log(`有效手机号: ${validPhones.length}个, 手机号列表: ${validPhones.join(', ')}`);

        // 如果提供了模板ID，获取模板信息
        let templateName = '';
        if (data.templateId) {
            console.log(`尝试获取模板: ${data.templateId}`);
            const template = await getTemplateById(data.templateId);
            if (!template) {
                console.log(`错误: 模板不存在 - ${data.templateId}`);
                return NextResponse.json(
                    { success: false, message: '指定的模板不存在' },
                    { status: 400 }
                );
            }
            templateName = template.name;
            console.log(`使用模板: ${templateName}`);
        }

        // 创建卡链接
        console.log(`尝试创建卡密链接: 用户=${username}, 应用=${templateName || data.appName}, 手机号=${validPhones.join(', ')}`);
        const cardLink = await createCardLink(username, {
            appName: templateName || data.appName,
            phoneNumbers: validPhones,
            phones: validPhones,
            templateId: data.templateId
        });
        console.log(`卡密链接创建成功: key=${cardLink.key}, url=${cardLink.url}`);

        return NextResponse.json({ success: true, data: cardLink });
    } catch (error) {
        console.error('创建卡密链接失败:', error);
        return NextResponse.json(
            { success: false, message: '创建卡密链接失败，请稍后重试' },
            { status: 500 }
        );
    }
} 