import { Database } from 'sqlite3';
import { open } from 'sqlite';

// 初始化数据库连接
async function getDb() {
    return open({
        filename: './data.db', // 确保这是正确的数据库文件路径
        driver: Database
    });
}

// 验证手机号格式
function isValidPhone(phone: string | null): boolean {
    if (!phone) return true; // null 是允许的
    return /^1[3-9]\d{9}$/.test(phone);
}

export async function POST(request: Request) {
    let db;
    try {
        // 验证管理员密码
        const adminPassword = request.headers.get('x-admin-password');
        if (adminPassword !== 'sj') {
            return Response.json({ error: "未授权访问" }, { status: 401 });
        }

        db = await getDb();
        const { username, appName, phone } = await request.json();

        // 验证用户名
        if (!username || username.trim() === '') {
            return Response.json({ error: "用户名是必填项" }, { status: 400 });
        }

        // 验证手机号格式
        const trimmedPhone = phone?.trim() || null;
        if (trimmedPhone && !isValidPhone(trimmedPhone)) {
            return Response.json({ error: "手机号格式不正确" }, { status: 400 });
        }

        // 使用参数化查询来插入数据
        const result = await db.run(
            `INSERT INTO cardlinks (username, app_name, phone, created_at, status)
             VALUES (?, ?, ?, datetime('now'), 'pending')`,
            [
                username.trim(),
                appName?.trim() || null,  // 如果 appName 是 undefined 或空字符串，使用 null
                trimmedPhone
            ]
        );

        return Response.json({
            success: true,
            id: result.lastID
        });

    } catch (error) {
        console.error('创建卡密链接失败:', error);
        // 根据错误类型返回不同的错误信息
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        return Response.json({
            error: "创建卡密链接失败",
            details: errorMessage
        }, { status: 500 });
    } finally {
        // 确保数据库连接被关闭
        if (db) await db.close();
    }
} 