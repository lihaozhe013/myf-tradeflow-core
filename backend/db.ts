/**
 * SQLite3 数据库连接与初始化
 */
import path from 'path';
import fs from 'fs';
import * as sqlite3Module from 'sqlite3';

const { initSql } = require('@/utils/dbSchema');

const sqlite3 = sqlite3Module.verbose();
const dbPath: string = path.resolve(__dirname, '../data/data.db');

/**
 * 初始化数据库连接
 * @returns {sqlite3Module.Database} 数据库实例
 */
function initializeDatabase(): sqlite3Module.Database {
  const dbExists: boolean = fs.existsSync(dbPath);
  const db = new sqlite3.Database(dbPath, (err: Error | null) => {
    if (err) {
      console.error('数据库连接失败:', err.message);
      process.exit(1);
    }
    if (!dbExists) {
      db.exec(initSql, (execErr: Error | null) => {
        if (execErr) {
          console.error('数据库初始化失败:', execErr.message);
        } else {
          console.log('数据库已初始化');
        }
      });
    } else {
      console.log('数据库已连接');
    }
  });
  return db;
}

export = initializeDatabase();
