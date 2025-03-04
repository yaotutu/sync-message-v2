const { migrate: addFirstUsedAt } = require('./add_first_used_at');

async function runMigrations() {
    try {
        console.log('开始运行数据库迁移...');

        // 运行迁移
        await addFirstUsedAt();

        console.log('数据库迁移完成');
    } catch (error) {
        console.error('数据库迁移失败:', error);
        throw error;
    }
}

module.exports = { runMigrations }; 