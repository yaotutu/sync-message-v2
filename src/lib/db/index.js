import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
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
let db = null;

// 获取数据库连接
async function getDb() {
  if (!db) {
    db = await open({
      filename: DB_FILE,
      driver: sqlite3.Database,
    });

    // 启用外键约束
    await db.run('PRAGMA foreign_keys = ON');
    // 启用WAL模式以提高并发性能
    await db.run('PRAGMA journal_mode = WAL');
  }
  return db;
}

// 关闭数据库连接
async function closeDb() {
  if (db) {
    await db.close();
    db = null;
  }
}

// SQL 查询执行器
async function sql(strings, ...values) {
  const connection = await getDb();
  try {
    const query = strings.reduce(
      (acc, str, i) => acc + str + (values[i] !== undefined ? '?' : ''),
      '',
    );
    return await connection.run(query, ...values.filter((v) => v !== undefined));
  } catch (error) {
    console.error('SQL error:', error);
    throw error;
  }
}

// 查询多条记录
async function sqlQuery(strings, ...values) {
  const connection = await getDb();
  try {
    const query = strings.reduce(
      (acc, str, i) => acc + str + (values[i] !== undefined ? '?' : ''),
      '',
    );
    return await connection.all(query, ...values.filter((v) => v !== undefined));
  } catch (error) {
    console.error('SQL query error:', error);
    throw error;
  }
}

// 查询单条记录
async function sqlGet(strings, ...values) {
  const connection = await getDb();
  try {
    const query = strings.reduce(
      (acc, str, i) => acc + str + (values[i] !== undefined ? '?' : ''),
      '',
    );
    return await connection.get(query, ...values.filter((v) => v !== undefined));
  } catch (error) {
    console.error('SQL get error:', error);
    throw error;
  }
}

// 事务处理
async function transaction(callback) {
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

export { getDb, closeDb, sql, sqlQuery, sqlGet, transaction };
