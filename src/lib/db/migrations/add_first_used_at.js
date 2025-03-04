const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function migrate() {
    // 打开数据库连接
    const db = await open({
        filename: path.join(process.cwd(), 'data', 'database.db'),
        driver: sqlite3.Database
    });

    try {
        // 开始事务
        await db.exec('BEGIN TRANSACTION');

        // 1. 创建临时表
        await db.exec(`
            CREATE TABLE card_links_temp (
                id TEXT PRIMARY KEY,
                key TEXT UNIQUE NOT NULL,
                username TEXT NOT NULL,
                app_name TEXT NOT NULL,
                phones TEXT NOT NULL,
                created_at INTEGER NOT NULL,
                url TEXT NOT NULL,
                template_id TEXT,
                first_used_at INTEGER,
                FOREIGN KEY (username) REFERENCES webhook_users(username),
                FOREIGN KEY (template_id) REFERENCES templates(id)
            )
        `);

        // 2. 复制数据
        await db.exec(`
            INSERT INTO card_links_temp (
                id, key, username, app_name, phones, 
                created_at, url, template_id, first_used_at
            )
            SELECT 
                id, key, username, app_name, phones, 
                created_at, url, template_id, NULL
            FROM card_links
        `);

        // 3. 删除旧表
        await db.exec('DROP TABLE card_links');

        // 4. 重命名新表
        await db.exec('ALTER TABLE card_links_temp RENAME TO card_links');

        // 提交事务
        await db.exec('COMMIT');

        console.log('成功添加 first_used_at 字段到 card_links 表');
    } catch (error) {
        // 如果出错，回滚事务
        await db.exec('ROLLBACK');
        console.error('迁移失败:', error);
        throw error;
    } finally {
        // 关闭数据库连接
        await db.close();
    }
}

module.exports = { migrate }; 