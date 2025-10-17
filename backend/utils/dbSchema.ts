/**
 * 数据库表结构 SQL 定义
 * 供数据库初始化和升级使用
 */

/**
 * 数据库初始化 SQL
 * 创建所有必要的表结构
 */
export const initSql = `
CREATE TABLE IF NOT EXISTS inbound_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_code TEXT,
  supplier_short_name TEXT,
  supplier_full_name TEXT,
  product_code TEXT,
  product_model TEXT,
  quantity INTEGER,
  unit_price REAL,
  total_price REAL,
  inbound_date TEXT,
  invoice_date TEXT,
  invoice_number TEXT,
  invoice_image_url TEXT,
  order_number TEXT,
  remark TEXT
);

CREATE TABLE IF NOT EXISTS outbound_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_code TEXT,
  customer_short_name TEXT,
  customer_full_name TEXT,
  product_code TEXT,
  product_model TEXT,
  quantity INTEGER,
  unit_price REAL,
  total_price REAL,
  outbound_date TEXT,
  invoice_date TEXT,
  invoice_number TEXT,
  invoice_image_url TEXT,
  order_number TEXT,
  remark TEXT
);

CREATE TABLE IF NOT EXISTS partners (
  code TEXT UNIQUE,
  short_name TEXT PRIMARY KEY,
  full_name TEXT,
  address TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  type INTEGER
);

CREATE TABLE IF NOT EXISTS products (
  code TEXT UNIQUE,
  category TEXT,
  product_model TEXT,
  remark TEXT
);

CREATE TABLE IF NOT EXISTS product_prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_short_name TEXT,
  product_model TEXT,
  effective_date TEXT,
  unit_price REAL
);

CREATE TABLE IF NOT EXISTS receivable_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_code TEXT,
  amount REAL,
  pay_date TEXT,
  pay_method TEXT,
  remark TEXT
);

CREATE TABLE IF NOT EXISTS payable_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_code TEXT,
  amount REAL,
  pay_date TEXT,
  pay_method TEXT,
  remark TEXT
);
`;

// 为了兼容 CommonJS require，也导出为 module.exports
module.exports = {
  initSql,
};
