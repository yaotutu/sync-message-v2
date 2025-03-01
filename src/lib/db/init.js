const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

// 确保数据目录存在
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 数据库文件路径
const DB_FILE = path.join(DATA_DIR, 'database.db');

async function initDatabase() {
    try {
        // 打开数据库连接
        const db = await open({
            filename: DB_FILE,
            driver: sqlite3.Database
        });

        // 创建用户表
        await db.exec(`
            CREATE TABLE IF NOT EXISTS webhook_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                webhook_key TEXT UNIQUE NOT NULL,
                created_at INTEGER NOT NULL
            )
        `);

        // 创建消息表
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

        // 创建卡密表
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

        // 创建模板表
        await db.exec(`
            CREATE TABLE IF NOT EXISTS templates (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        `);

        // 创建规则表
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

        // 启用外键约束
        await db.exec('PRAGMA foreign_keys = ON');

        // 启用WAL模式以提高并发性能
        await db.exec('PRAGMA journal_mode = WAL');

        console.log('数据库初始化成功');
        await db.close();
    } catch (error) {
        console.error('数据库初始化失败:', error);
        process.exit(1);
    }
}

// 执行初始化
initDatabase(); 