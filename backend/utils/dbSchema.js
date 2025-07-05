// 数据库表结构SQL，供主服务引用

const initSql = `
CREATE TABLE IF NOT EXISTS inbound_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  supplier_short_name TEXT,
  supplier_full_name TEXT,
  product_model TEXT,
  quantity INTEGER,
  unit_price REAL,
  total_price REAL,
  inbound_date TEXT,
  invoice_date TEXT,
  invoice_number TEXT,
  invoice_image_url TEXT,
  order_number TEXT,
  payment_date TEXT,
  payment_amount REAL,
  payable_amount REAL,
  payment_method TEXT,
  remark TEXT
);

CREATE TABLE IF NOT EXISTS outbound_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_short_name TEXT,
  customer_full_name TEXT,
  product_model TEXT,
  quantity INTEGER,
  unit_price REAL,
  total_price REAL,
  outbound_date TEXT,
  invoice_date TEXT,
  invoice_number TEXT,
  invoice_image_url TEXT,
  order_number TEXT,
  collection_date TEXT,
  collection_amount REAL,
  receivable_amount REAL,
  collection_method TEXT,
  remark TEXT
);

CREATE TABLE IF NOT EXISTS stock (
  record_id INTEGER,
  product_model TEXT,
  stock_quantity INTEGER,
  update_time TEXT
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
  short_name TEXT PRIMARY KEY,
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

CREATE TABLE IF NOT EXISTS product_categories (
  name TEXT PRIMARY KEY
);
`;

module.exports = {
  initSql,
};
