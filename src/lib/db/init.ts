import { getDb, closeDb } from './index';
import path from 'path';
import fs from 'fs';

// 创建用户表
async function createUsersTable() {
    const db = await getDb();
    await db.exec(`
        CREATE TABLE IF NOT EXISTS webhook_users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            webhook_key TEXT UNIQUE NOT NULL,
            created_at INTEGER NOT NULL
        )
    `);
}

// 创建消息表
async function createMessagesTable() {
    const db = await getDb();
    await db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            sms_content TEXT NOT NULL,
            rec_time TEXT,
            received_at INTEGER NOT NULL,
            FOREIGN KEY (username) REFERENCES webhook_users(username)
        )
    `);
}

// 创建卡密表
async function createCardKeysTable() {
    const db = await getDb();
    await db.exec(`
        CREATE TABLE IF NOT EXISTS card_keys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT UNIQUE NOT NULL,
            username TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'unused',
            created_at INTEGER NOT NULL,
            used_at INTEGER,
            FOREIGN KEY (username) REFERENCES webhook_users(username)
        )
    `);
}

// 创建模板表
async function createTemplatesTable() {
    const db = await getDb();
    await db.exec(`
        CREATE TABLE IF NOT EXISTS templates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `);
}

// 创建规则表
async function createRulesTable() {
    const db = await getDb();
    await db.exec(`
        CREATE TABLE IF NOT EXISTS rules (
            id TEXT PRIMARY KEY,
            template_id TEXT NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('include', 'exclude')),
            mode TEXT NOT NULL CHECK (mode IN ('simple', 'regex')),
            pattern TEXT NOT NULL,
            description TEXT,
            order_num INTEGER NOT NULL,
            is_active BOOLEAN NOT NULL DEFAULT 1,
            FOREIGN KEY (template_id) REFERENCES templates (id) ON DELETE CASCADE
        )
    `);
}

// 初始化数据库
export async function initDatabase() {
    try {
        // 创建数据目录
        const dbDir = path.join(process.cwd(), 'data');
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir);
        }

        // 创建所有表
        await createUsersTable();
        await createMessagesTable();
        await createCardKeysTable();
        await createTemplatesTable();
        await createRulesTable();

        console.log('数据库初始化成功');
    } catch (error) {
        console.error('数据库初始化失败:', error);
        throw error;
    } finally {
        // 关闭数据库连接
        await closeDb();
    }
}

// 如果这个文件被直接运行
if (require.main === module) {
    initDatabase().catch(error => {
        console.error('初始化过程出错:', error);
        process.exit(1);
    });
} 