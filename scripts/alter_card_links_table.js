const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 确保数据目录存在
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 数据库文件路径
const DB_FILE = path.join(DATA_DIR, 'database.db');

// 打开数据库连接
const db = new sqlite3.Database(DB_FILE, (err) => {
    if (err) {
        console.error('打开数据库失败:', err.message);
        process.exit(1);
    }
    console.log('已连接到数据库');
});

// 启用外键约束
db.run('PRAGMA foreign_keys = OFF', (err) => {
    if (err) {
        console.error('启用外键约束失败:', err.message);
        db.close();
        process.exit(1);
    }
    console.log('已禁用外键约束');

    // 开始事务
    db.run('BEGIN TRANSACTION', (err) => {
        if (err) {
            console.error('开始事务失败:', err.message);
            db.close();
            process.exit(1);
        }
        console.log('开始事务');

        // 创建临时表
        db.run(`
            CREATE TABLE card_links_temp (
                id TEXT PRIMARY KEY,
                key TEXT UNIQUE NOT NULL,
                username TEXT NOT NULL,
                app_name TEXT,
                phones TEXT,
                created_at INTEGER NOT NULL,
                url TEXT NOT NULL,
                template_id TEXT,
                first_used_at INTEGER,
                FOREIGN KEY (username) REFERENCES webhook_users(username),
                FOREIGN KEY (template_id) REFERENCES templates(id)
            )
        `, (err) => {
            if (err) {
                console.error('创建临时表失败:', err.message);
                db.run('ROLLBACK');
                db.close();
                process.exit(1);
            }
            console.log('已创建临时表');

            // 复制数据
            db.run(`
                INSERT INTO card_links_temp
                SELECT * FROM card_links
            `, (err) => {
                if (err) {
                    console.error('复制数据失败:', err.message);
                    db.run('ROLLBACK');
                    db.close();
                    process.exit(1);
                }
                console.log('已复制数据');

                // 删除原表
                db.run('DROP TABLE card_links', (err) => {
                    if (err) {
                        console.error('删除原表失败:', err.message);
                        db.run('ROLLBACK');
                        db.close();
                        process.exit(1);
                    }
                    console.log('已删除原表');

                    // 重命名临时表
                    db.run('ALTER TABLE card_links_temp RENAME TO card_links', (err) => {
                        if (err) {
                            console.error('重命名临时表失败:', err.message);
                            db.run('ROLLBACK');
                            db.close();
                            process.exit(1);
                        }
                        console.log('已重命名临时表');

                        // 提交事务
                        db.run('COMMIT', (err) => {
                            if (err) {
                                console.error('提交事务失败:', err.message);
                                db.run('ROLLBACK');
                                db.close();
                                process.exit(1);
                            }
                            console.log('已提交事务');

                            // 重新启用外键约束
                            db.run('PRAGMA foreign_keys = ON', (err) => {
                                if (err) {
                                    console.error('重新启用外键约束失败:', err.message);
                                    db.close();
                                    process.exit(1);
                                }
                                console.log('已重新启用外键约束');

                                console.log('表结构修改完成，app_name 和 phones 字段现在可为空');
                                db.close();
                            });
                        });
                    });
                });
            });
        });
    });
}); 