/**
 * SQLite3 数据库连接与初始化
 */
import fs from 'fs';
import sqlite3 from 'sqlite3';
import { initSql } from '@/utils/dbSchema';
import { resolveFilesInDataPath } from '@/utils/paths';

const sqlite3Verbose = sqlite3.verbose();
const dbPath: string = resolveFilesInDataPath('data.db');

/**
 * 初始化数据库连接
 * @returns {sqlite3.Database} 数据库实例
 */
function initializeDatabase(): sqlite3.Database {
  const dbExists: boolean = fs.existsSync(dbPath);
  const db = new sqlite3Verbose.Database(dbPath, (err: Error | null) => {
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

export default initializeDatabase();
