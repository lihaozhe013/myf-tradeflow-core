/**
 * 数据库升级和字段检查模块
 * 负责在服务启动时自动检查和升级数据库结构
 */

const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { initSql } = require('./dbSchema');

/**
 * 启动时检查所有表和列是否存在，不存在则自动创建
 * 包含数据库结构升级逻辑，确保字段完整性
 */
function ensureAllTablesAndColumns() {
  const dbPath = path.resolve(__dirname, '../data.db');
  const dbInstance = new sqlite3.Database(dbPath);
  
  console.log('🔧 开始数据库结构检查...');
  
  // 1. 执行基础表结构创建
  dbInstance.exec(initSql, (err) => {
    if (err) {
      console.error('❌ 数据库结构检查/升级失败:', err.message);
      dbInstance.close();
      return;
    }
    
    console.log('✅ 基础表结构已确认');
    
    // 2. 检查并补全字段
    checkAndAddMissingColumns(dbInstance);
  });
}

/**
 * 检查并添加缺失的字段
 * @param {sqlite3.Database} dbInstance 数据库实例
 */
function checkAndAddMissingColumns(dbInstance) {
  let pendingChecks = 4; // 需要检查的表数量
  
  // 检查并补全 partners.code 字段
  dbInstance.all("PRAGMA table_info(partners)", (err, columns) => {
    if (err) {
      console.error('❌ 检查 partners 表结构失败:', err.message);
    } else if (columns && !columns.some(col => col.name === 'code')) {
      dbInstance.run("ALTER TABLE partners ADD COLUMN code TEXT UNIQUE", (err2) => {
        if (err2) {
          console.error('❌ 添加 partners.code 字段失败:', err2.message);
        } else {
          console.log('✅ 已补全 partners.code 字段');
        }
      });
    } else {
      console.log('✅ partners.code 字段已存在');
    }
    
    pendingChecks--;
    if (pendingChecks === 0) finishUpgrade(dbInstance);
  });
  
  // 检查并补全 products.code 字段
  dbInstance.all("PRAGMA table_info(products)", (err, columns) => {
    if (err) {
      console.error('❌ 检查 products 表结构失败:', err.message);
    } else if (columns && !columns.some(col => col.name === 'code')) {
      dbInstance.run("ALTER TABLE products ADD COLUMN code TEXT UNIQUE", (err2) => {
        if (err2) {
          console.error('❌ 添加 products.code 字段失败:', err2.message);
        } else {
          console.log('✅ 已补全 products.code 字段');
        }
      });
    } else {
      console.log('✅ products.code 字段已存在');
    }
    
    pendingChecks--;
    if (pendingChecks === 0) finishUpgrade(dbInstance);
  });

  // 检查并补全 inbound_records 的代号字段
  dbInstance.all("PRAGMA table_info(inbound_records)", (err, columns) => {
    if (err) {
      console.error('❌ 检查 inbound_records 表结构失败:', err.message);
    } else if (columns) {
      const needsSupplierCode = !columns.some(col => col.name === 'supplier_code');
      const needsProductCode = !columns.some(col => col.name === 'product_code');
      
      if (needsSupplierCode) {
        dbInstance.run("ALTER TABLE inbound_records ADD COLUMN supplier_code TEXT", (err2) => {
          if (err2) {
            console.error('❌ 添加 inbound_records.supplier_code 字段失败:', err2.message);
          } else {
            console.log('✅ 已补全 inbound_records.supplier_code 字段');
          }
        });
      }
      
      if (needsProductCode) {
        dbInstance.run("ALTER TABLE inbound_records ADD COLUMN product_code TEXT", (err3) => {
          if (err3) {
            console.error('❌ 添加 inbound_records.product_code 字段失败:', err3.message);
          } else {
            console.log('✅ 已补全 inbound_records.product_code 字段');
          }
        });
      }
      
      if (!needsSupplierCode && !needsProductCode) {
        console.log('✅ inbound_records 代号字段已存在');
      }
    }
    
    pendingChecks--;
    if (pendingChecks === 0) finishUpgrade(dbInstance);
  });

  // 检查并补全 outbound_records 的代号字段
  dbInstance.all("PRAGMA table_info(outbound_records)", (err, columns) => {
    if (err) {
      console.error('❌ 检查 outbound_records 表结构失败:', err.message);
    } else if (columns) {
      const needsCustomerCode = !columns.some(col => col.name === 'customer_code');
      const needsProductCode = !columns.some(col => col.name === 'product_code');
      
      if (needsCustomerCode) {
        dbInstance.run("ALTER TABLE outbound_records ADD COLUMN customer_code TEXT", (err2) => {
          if (err2) {
            console.error('❌ 添加 outbound_records.customer_code 字段失败:', err2.message);
          } else {
            console.log('✅ 已补全 outbound_records.customer_code 字段');
          }
        });
      }
      
      if (needsProductCode) {
        dbInstance.run("ALTER TABLE outbound_records ADD COLUMN product_code TEXT", (err3) => {
          if (err3) {
            console.error('❌ 添加 outbound_records.product_code 字段失败:', err3.message);
          } else {
            console.log('✅ 已补全 outbound_records.product_code 字段');
          }
        });
      }
      
      if (!needsCustomerCode && !needsProductCode) {
        console.log('✅ outbound_records 代号字段已存在');
      }
    }
    
    pendingChecks--;
    if (pendingChecks === 0) finishUpgrade(dbInstance);
  });
}

/**
 * 完成数据库升级，关闭连接
 * @param {sqlite3.Database} dbInstance 数据库实例
 */
function finishUpgrade(dbInstance) {
  console.log('✅ 数据库结构检查/升级完成');
  dbInstance.close((err) => {
    if (err) {
      console.error('❌ 关闭数据库连接失败:', err.message);
    }
  });
}

module.exports = {
  ensureAllTablesAndColumns
};
