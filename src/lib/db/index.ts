import { Database as SQLiteDatabase, Statement } from 'sqlite3';
import { Database, open } from 'sqlite';
import path from 'path';
import fs from 'fs';

// 确保数据目录存在
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 数据库文件路径
const DB_FILE = path.join(DATA_DIR, 'database.db');

// 数据库连接实例
let db: Database<SQLiteDatabase, Statement> | null = null;

// 获取数据库连接
export async function getDb(): Promise<Database<SQLiteDatabase, Statement>> {
    if (!db) {
        db = await open({
            filename: DB_FILE,
            driver: SQLiteDatabase
        });

        // 启用外键约束
        await db.run('PRAGMA foreign_keys = ON');

        // 启用WAL模式以提高并发性能
        await db.run('PRAGMA journal_mode = WAL');
    }
    return db;
}

// 关闭数据库连接
export async function closeDb(): Promise<void> {
    if (db) {
        await db.close();
        db = null;
    }
}

// SQL 查询执行器
export async function sql(strings: TemplateStringsArray, ...values: any[]): Promise<any> {
    const connection = await getDb();
    try {
        const query = strings.reduce((acc, str, i) => acc + str + (values[i] !== undefined ? '?' : ''), '');
        return await connection.run(query, ...values.filter(v => v !== undefined));
    } catch (error) {
        console.error('SQL error:', error);
        throw error;
    }
}

// 查询多条记录
export async function sqlQuery<T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T[]> {
    const connection = await getDb();
    try {
        const query = strings.reduce((acc, str, i) => acc + str + (values[i] !== undefined ? '?' : ''), '');
        return await connection.all(query, ...values.filter(v => v !== undefined));
    } catch (error) {
        console.error('SQL query error:', error);
        throw error;
    }
}

// 查询单条记录
export async function sqlGet<T = any>(strings: TemplateStringsArray, ...values: any[]): Promise<T | undefined> {
    const connection = await getDb();
    try {
        const query = strings.reduce((acc, str, i) => acc + str + (values[i] !== undefined ? '?' : ''), '');
        return await connection.get<T>(query, ...values.filter(v => v !== undefined));
    } catch (error) {
        console.error('SQL get error:', error);
        throw error;
    }
}

// 事务处理
export async function transaction<T>(callback: (db: Database<SQLiteDatabase, Statement>) => Promise<T>): Promise<T> {
    const connection = await getDb();
    try {
        await connection.run('BEGIN');
        const result = await callback(connection);
        await connection.run('COMMIT');
        return result;
    } catch (error) {
        await connection.run('ROLLBACK');
        throw error;
    }
} 