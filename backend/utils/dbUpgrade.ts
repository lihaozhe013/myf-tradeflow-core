/**
 * 数据库升级和字段检查模块
 * 负责在服务启动时自动检查和升级数据库结构
 */

import path from 'path';
import { fileURLToPath } from 'url';
import * as sqlite3Module from 'sqlite3';
import { initSql } from '@/utils/dbSchema';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sqlite3 = sqlite3Module.verbose();

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

/**
 * 启动时检查所有表和列是否存在，不存在则自动创建
 * 包含数据库结构升级逻辑，确保字段完整性
 */
export function ensureAllTablesAndColumns(): void {
  const dbPath: string = path.resolve(__dirname, '../../data/data.db');
  const dbInstance: sqlite3Module.Database = new sqlite3.Database(dbPath);
  
  // 1. 执行基础表结构创建
  dbInstance.exec(initSql, (err: Error | null) => {
    if (err) {
      console.error('❌ 数据库结构检查/升级失败:', err.message);
      dbInstance.close();
      return;
    }
    
    // 2. 检查并补全字段
    checkAndAddMissingColumns(dbInstance);
  });
}

/**
 * 检查并添加缺失的字段
 * @param {sqlite3Module.Database} dbInstance 数据库实例
 */
function checkAndAddMissingColumns(dbInstance: sqlite3Module.Database): void {
  let pendingChecks = 4; // 需要检查的表数量
  
  // 检查并补全 partners.code 字段
  dbInstance.all("PRAGMA table_info(partners)", (err: Error | null, columns: ColumnInfo[]) => {
    if (err) {
      console.error('❌ 检查 partners 表结构失败:', err.message);
    } else if (columns && !columns.some(col => col.name === 'code')) {
      dbInstance.run("ALTER TABLE partners ADD COLUMN code TEXT UNIQUE", (err2: Error | null) => {
        if (err2) {
          console.error('❌ 添加 partners.code 字段失败:', err2.message);
        }
      });
    }
    
    pendingChecks--;
    if (pendingChecks === 0) finishUpgrade(dbInstance);
  });
  
  // 检查并补全 products.code 字段
  dbInstance.all("PRAGMA table_info(products)", (err: Error | null, columns: ColumnInfo[]) => {
    if (err) {
      console.error('❌ 检查 products 表结构失败:', err.message);
    } else if (columns && !columns.some(col => col.name === 'code')) {
      dbInstance.run("ALTER TABLE products ADD COLUMN code TEXT UNIQUE", (err2: Error | null) => {
        if (err2) {
          console.error('❌ 添加 products.code 字段失败:', err2.message);
        }
      });
    }
    
    pendingChecks--;
    if (pendingChecks === 0) finishUpgrade(dbInstance);
  });

  // 检查并补全 inbound_records 的代号字段和 total_price 字段
  dbInstance.all("PRAGMA table_info(inbound_records)", (err: Error | null, columns: ColumnInfo[]) => {
    if (err) {
      console.error('❌ 检查 inbound_records 表结构失败:', err.message);
    } else if (columns) {
      const needsSupplierCode = !columns.some(col => col.name === 'supplier_code');
      const needsProductCode = !columns.some(col => col.name === 'product_code');
      const needsTotalPrice = !columns.some(col => col.name === 'total_price');
      
      if (needsSupplierCode) {
        dbInstance.run("ALTER TABLE inbound_records ADD COLUMN supplier_code TEXT", (err2: Error | null) => {
          if (err2) {
            console.error('❌ 添加 inbound_records.supplier_code 字段失败:', err2.message);
          }
        });
      }
      
      if (needsProductCode) {
        dbInstance.run("ALTER TABLE inbound_records ADD COLUMN product_code TEXT", (err3: Error | null) => {
          if (err3) {
            console.error('❌ 添加 inbound_records.product_code 字段失败:', err3.message);
          }
        });
      }
      
      if (needsTotalPrice) {
        dbInstance.run("ALTER TABLE inbound_records ADD COLUMN total_price REAL", (err4: Error | null) => {
          if (err4) {
            console.error('❌ 添加 inbound_records.total_price 字段失败:', err4.message);
          } else {
            console.log('✅ 添加 inbound_records.total_price 字段成功');
            // 计算现有记录的 total_price
            dbInstance.run(`
              UPDATE inbound_records 
              SET total_price = ROUND((quantity * unit_price) * 100) / 100 
              WHERE total_price IS NULL
            `, (updateErr: Error | null) => {
              if (updateErr) {
                console.error('❌ 更新 inbound_records.total_price 值失败:', updateErr.message);
              } else {
                console.log('✅ 更新 inbound_records.total_price 值成功');
              }
            });
          }
        });
      }
      
      if (needsSupplierCode && needsProductCode) {
        console.log('❌ inbound_records 代号字段未存在');
      }
    }
    
    pendingChecks--;
    if (pendingChecks === 0) finishUpgrade(dbInstance);
  });

  // 检查并补全 outbound_records 的代号字段和 total_price 字段
  dbInstance.all("PRAGMA table_info(outbound_records)", (err: Error | null, columns: ColumnInfo[]) => {
    if (err) {
      console.error('❌ 检查 outbound_records 表结构失败:', err.message);
    } else if (columns) {
      const needsCustomerCode = !columns.some(col => col.name === 'customer_code');
      const needsProductCode = !columns.some(col => col.name === 'product_code');
      const needsTotalPrice = !columns.some(col => col.name === 'total_price');
      
      if (needsCustomerCode) {
        dbInstance.run("ALTER TABLE outbound_records ADD COLUMN customer_code TEXT", (err2: Error | null) => {
          if (err2) {
            console.error('❌ 添加 outbound_records.customer_code 字段失败:', err2.message);
          }
        });
      }
      
      if (needsProductCode) {
        dbInstance.run("ALTER TABLE outbound_records ADD COLUMN product_code TEXT", (err3: Error | null) => {
          if (err3) {
            console.error('❌ 添加 outbound_records.product_code 字段失败:', err3.message);
          }
        });
      }
      
      if (needsTotalPrice) {
        dbInstance.run("ALTER TABLE outbound_records ADD COLUMN total_price REAL", (err4: Error | null) => {
          if (err4) {
            console.error('❌ 添加 outbound_records.total_price 字段失败:', err4.message);
          } else {
            console.log('✅ 添加 outbound_records.total_price 字段成功');
            // 计算现有记录的 total_price
            dbInstance.run(`
              UPDATE outbound_records 
              SET total_price = ROUND((quantity * unit_price) * 100) / 100 
              WHERE total_price IS NULL
            `, (updateErr: Error | null) => {
              if (updateErr) {
                console.error('❌ 更新 outbound_records.total_price 值失败:', updateErr.message);
              } else {
                console.log('✅ 更新 outbound_records.total_price 值成功');
              }
            });
          }
        });
      }
      
      if (needsCustomerCode && needsProductCode) {
        console.log('❌ outbound_records 代号字段未存在');
      }
    }
    
    pendingChecks--;
    if (pendingChecks === 0) finishUpgrade(dbInstance);
  });
}

/**
 * 完成数据库升级，关闭连接
 * @param {sqlite3Module.Database} dbInstance 数据库实例
 */
function finishUpgrade(dbInstance: sqlite3Module.Database): void {
  dbInstance.close((err: Error | null) => {
    if (err) {
      console.error('❌ 关闭数据库连接失败:', err.message);
    }
  });
}
