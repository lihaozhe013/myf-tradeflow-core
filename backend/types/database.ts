/**
 * 数据库表结构类型定义
 */

/**
 * 入库记录
 */
export interface InboundRecord {
  id?: number;
  supplier_code: string;
  supplier_short_name: string;
  supplier_full_name?: string;
  product_code: string;
  product_model: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  inbound_date: string;
  invoice_date?: string;
  invoice_number?: string;
  invoice_image_url?: string;
  order_number?: string;
  remark?: string;
}

/**
 * 出库记录
 */
export interface OutboundRecord {
  id?: number;
  customer_code: string;
  customer_short_name: string;
  customer_full_name?: string;
  product_code: string;
  product_model: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  outbound_date: string;
  invoice_date?: string;
  invoice_number?: string;
  invoice_image_url?: string;
  order_number?: string;
  remark?: string;
}

/**
 * 合作伙伴（客户/供应商）
 */
export interface Partner {
  code: string;
  short_name: string;
  full_name?: string;
  address?: string;
  contact_person?: string;
  contact_phone?: string;
  type: 0 | 1; // 0=供应商, 1=客户
}

/**
 * 产品
 */
export interface Product {
  code: string;
  category?: string;
  product_model: string;
  remark?: string;
}

/**
 * 产品价格
 */
export interface ProductPrice {
  id?: number;
  partner_short_name: string;
  product_model: string;
  effective_date: string;
  unit_price: number;
}

/**
 * 应收账款付款记录
 */
export interface ReceivablePayment {
  id?: number;
  customer_code: string;
  amount: number;
  pay_date: string;
  pay_method?: string;
  remark?: string;
}

/**
 * 应付账款付款记录
 */
export interface PayablePayment {
  id?: number;
  supplier_code: string;
  amount: number;
  pay_date: string;
  pay_method?: string;
  remark?: string;
}

/**
 * 用户（如果将来需要）
 */
export interface User {
  id?: number;
  username: string;
  password_hash: string;
  role: string;
  created_at?: string;
  last_login?: string;
}

/**
 * SQLite 数据库实例类型
 */
export interface DatabaseInstance {
  run: (sql: string, params?: any[], callback?: (err: Error | null) => void) => void;
  get: (sql: string, params?: any[], callback?: (err: Error | null, row: any) => void) => void;
  all: (sql: string, params?: any[], callback?: (err: Error | null, rows: any[]) => void) => void;
  exec: (sql: string, callback?: (err: Error | null) => void) => void;
  close: (callback?: (err: Error | null) => void) => void;
}
