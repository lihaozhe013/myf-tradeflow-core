# 数据库设计

## 数据库类型

**SQLite** - 轻量级文件数据库，适合中小型应用

- 数据库文件: `/data/data.db`
- 支持事务和并发
- 无需独立数据库服务器

## 核心数据表

### 1. 入库记录表 `inbound_records`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 入库单号 |
| supplier_code | TEXT | NOT NULL | 供应商代号 |
| supplier_short_name | TEXT | NOT NULL | 供应商简称 |
| supplier_full_name | TEXT | | 供应商全称 |
| product_code | TEXT | NOT NULL | 产品代号 |
| product_model | TEXT | NOT NULL | 产品型号 |
| quantity | INTEGER | NOT NULL | 数量 |
| unit_price | REAL | NOT NULL | 单价 |
| total_price | REAL | NOT NULL | 总价(自动计算) |
| inbound_date | TEXT | NOT NULL | 入库时间 |
| invoice_date | TEXT | | 开票日期 |
| invoice_number | TEXT | | 发票号码 |
| invoice_image_url | TEXT | | 发票图片链接 |
| order_number | TEXT | | 订单号 |
| remark | TEXT | | 备注 |

**索引**:
```sql
CREATE INDEX idx_inbound_supplier ON inbound_records(supplier_code);
CREATE INDEX idx_inbound_product ON inbound_records(product_model);
CREATE INDEX idx_inbound_date ON inbound_records(inbound_date);
```

### 2. 出库记录表 `outbound_records`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 出库单号 |
| customer_code | TEXT | NOT NULL | 客户代号 |
| customer_short_name | TEXT | NOT NULL | 客户简称 |
| customer_full_name | TEXT | | 客户全称 |
| product_code | TEXT | NOT NULL | 产品代号 |
| product_model | TEXT | NOT NULL | 产品型号 |
| quantity | INTEGER | NOT NULL | 数量 |
| unit_price | REAL | NOT NULL | 单价 |
| total_price | REAL | NOT NULL | 总价(自动计算) |
| outbound_date | TEXT | NOT NULL | 出库时间 |
| invoice_date | TEXT | | 开票日期 |
| invoice_number | TEXT | | 发票号码 |
| invoice_image_url | TEXT | | 发票图片链接 |
| order_number | TEXT | | 订单号 |
| remark | TEXT | | 备注 |

**索引**:
```sql
CREATE INDEX idx_outbound_customer ON outbound_records(customer_code);
CREATE INDEX idx_outbound_product ON outbound_records(product_model);
CREATE INDEX idx_outbound_date ON outbound_records(outbound_date);
```

### 3. 客户供应商表 `partners`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| code | TEXT | UNIQUE NOT NULL | 代号(唯一) |
| short_name | TEXT | PRIMARY KEY | 简称(唯一主键) |
| full_name | TEXT | | 全称 |
| address | TEXT | | 地址 |
| contact_person | TEXT | | 联系人 |
| contact_phone | TEXT | | 联系电话 |
| type | INTEGER | NOT NULL | 类型: 0=供应商, 1=客户 |

**约束**:
- 代号和简称都必须唯一
- 类型字段用于区分供应商和客户

### 4. 产品表 `products`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| code | TEXT | UNIQUE NOT NULL | 产品代号(唯一) |
| category | TEXT | | 产品类别 |
| product_model | TEXT | PRIMARY KEY | 产品型号(唯一主键) |
| remark | TEXT | | 备注 |

### 5. 产品价格表 `product_prices`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 唯一标识 |
| partner_short_name | TEXT | NOT NULL | 供应商/客户简称 |
| product_model | TEXT | NOT NULL | 产品型号 |
| effective_date | TEXT | NOT NULL | 生效日期 |
| unit_price | REAL | NOT NULL | 单价 |

**索引**:
```sql
CREATE INDEX idx_prices_partner_product ON product_prices(partner_short_name, product_model);
CREATE INDEX idx_prices_date ON product_prices(effective_date);
```

### 6. 回款记录表 `receivable_payments`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 唯一标识 |
| customer_code | TEXT | NOT NULL | 客户代号 |
| amount | REAL | NOT NULL | 回款金额 |
| pay_date | TEXT | NOT NULL | 回款日期 |
| pay_method | TEXT | | 回款方式 |
| remark | TEXT | | 备注 |

### 7. 付款记录表 `payable_payments`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 唯一标识 |
| supplier_code | TEXT | NOT NULL | 供应商代号 |
| amount | REAL | NOT NULL | 付款金额 |
| pay_date | TEXT | NOT NULL | 付款日期 |
| pay_method | TEXT | | 付款方式 |
| remark | TEXT | | 备注 |

### 8. 用户表 `users`

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | 用户ID |
| username | TEXT | UNIQUE NOT NULL | 用户名 |
| password_hash | TEXT | NOT NULL | 密码哈希 |
| role | TEXT | NOT NULL | 角色: admin/editor/viewer |
| created_at | TEXT | | 创建时间 |
| last_login | TEXT | | 最后登录时间 |

## 缓存文件结构

### 库存汇总缓存 `stock-summary.json`

```json
{
  "last_updated": "2025-08-18T10:30:00.000Z",
  "total_cost_estimate": 125000.50,
  "products": {
    "产品型号A": {
      "current_stock": 100,
      "last_inbound": "2025-07-20",
      "last_outbound": "2025-07-22"
    }
  }
}
```

### 概览统计缓存 `overview-stats.json`

```json
{
  "overview": {
    "total_sales_amount": 500000.00,
    "total_purchase_amount": 400000.00,
    "sold_goods_cost": 350000.00,
    "customer_count": 25,
    "supplier_count": 15
  },
  "out_of_stock_products": [
    { "product_model": "iPhone 15 Pro" }
  ],
  "top_sales_products": [
    { "product_model": "iPhone 15", "total_sales": 100000.00 }
  ],
  "monthly_stock_changes": {
    "iPhone 15": {
      "month_start_stock": 50,
      "current_stock": 30,
      "monthly_change": -20
    }
  }
}
```

### 分析数据缓存 `analysis-cache.json`

```json
{
  "2025-01-01_2025-01-31_ALL_ALL": {
    "sales_amount": 150000.00,
    "cost_amount": 120000.00,
    "profit_amount": 30000.00,
    "profit_rate": 20.00,
    "last_updated": "2025-08-18T10:30:00.000Z"
  }
}
```

## 数据关系

### 外键关系
- `inbound_records.supplier_code` → `partners.code`
- `outbound_records.customer_code` → `partners.code`
- `inbound_records.product_model` → `products.product_model`
- `outbound_records.product_model` → `products.product_model`
- `product_prices.partner_short_name` → `partners.short_name`
- `product_prices.product_model` → `products.product_model`

### 业务约束
1. **代号-简称-全称三项绑定**: 客户供应商的代号、简称、全称必须一致
2. **价格历史管理**: 按生效日期管理价格，查询时取最近有效价格
3. **库存计算**: 入库增加库存，出库减少库存，允许负库存
4. **精确计算**: 所有金额字段使用decimal.js进行精确计算

## 数据完整性

### 唯一性约束
- 客户供应商代号和简称全局唯一
- 产品代号和型号全局唯一
- 用户名唯一

### 数据验证
- 数量必须为正整数
- 金额精度保持5位小数
- 日期格式统一为ISO 8601格式
- 客户供应商类型必须为0或1

### 级联操作
- 删除客户供应商时检查是否有关联记录
- 删除产品时检查是否有关联记录
- 修改客户供应商信息时同步更新关联记录

---

*本文档最后更新: 2025年8月*
