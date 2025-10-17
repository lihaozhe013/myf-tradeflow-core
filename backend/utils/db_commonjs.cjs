// SQLite3数据库连接与初始化
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { initSql } = require('./dbSchema_commonjs.cjs');

const dbPath = path.resolve(__dirname, '../../data/data.db');
let db;

function initializeDatabase() {
  const dbExists = fs.existsSync(dbPath);
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('数据库连接失败:', err.message);
      process.exit(1);
    }
    if (!dbExists) {
      db.exec(initSql, (err) => {
        if (err) {
          console.error('数据库初始化失败:', err.message);
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

module.exports = initializeDatabase();
