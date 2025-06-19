import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

// 初始化数据库
export async function initDatabase() {
  try {
    const dbDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir);
    }

    const prisma = new PrismaClient();

    // 执行迁移
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS webhook_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        webhook_key TEXT UNIQUE NOT NULL,
        created_at INTEGER NOT NULL
      )
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        sms_content TEXT NOT NULL,
        rec_time TEXT,
        received_at INTEGER NOT NULL,
        FOREIGN KEY (username) REFERENCES webhook_users(username)
      )
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS card_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'unused',
        created_at INTEGER NOT NULL,
        used_at INTEGER,
        FOREIGN KEY (username) REFERENCES webhook_users(username)
      )
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS rules (
        id TEXT PRIMARY KEY,
        template_id TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('include', 'exclude')),
        mode TEXT NOT NULL CHECK (mode IN ('simple_include', 'simple_exclude', 'regex')),
        pattern TEXT NOT NULL,
        description TEXT,
        order_num INTEGER NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT 1,
        FOREIGN KEY (template_id) REFERENCES templates (id) ON DELETE CASCADE
      )
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS card_links (
        id TEXT PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        username TEXT NOT NULL,
        app_name TEXT NOT NULL,
        phones TEXT,
        created_at INTEGER NOT NULL,
        first_used_at INTEGER,
        url TEXT NOT NULL,
        template_id TEXT,
        FOREIGN KEY (username) REFERENCES webhook_users(username),
        FOREIGN KEY (template_id) REFERENCES templates(id)
      )
    `;

    console.log('数据库初始化成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

// 如果这个文件被直接运行
if (import.meta.url === `file://${process.argv[1]}`) {
  initDatabase().catch((error) => {
    console.error('初始化过程出错:', error);
    process.exit(1);
  });
}
