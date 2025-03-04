const { runMigrations } = require('../src/lib/db/migrations');

async function main() {
    try {
        await runMigrations();
        process.exit(0);
    } catch (error) {
        console.error('迁移失败:', error);
        process.exit(1);
    }
}

main(); 