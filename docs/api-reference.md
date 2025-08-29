# API接口文档

## 接口规范

- **基础URL**: `/api/`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证接口

### 用户登录
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}

Response:
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "username": "admin",
    "role": "admin"
  }
}
```

### 获取当前用户
```
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "username": "admin",
  "role": "admin"
}
```

### 用户登出
```
POST /api/auth/logout
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "登出成功"
}
```

## 入库管理

### 获取入库记录
```
GET /api/inbound?page=1&pageSize=10&supplier_code=S001&product_model=iPhone
Authorization: Bearer <token>

Response:
{
  "data": [...],
  "total": 100,
  "page": 1,
  "pageSize": 10
}
```

### 新增入库记录
```
POST /api/inbound
Authorization: Bearer <token>

{
  "supplier_code": "S001",
  "supplier_short_name": "苹果公司",
  "product_model": "iPhone 15",
  "quantity": 10,
  "unit_price": 8000.00,
  "inbound_date": "2025-08-18"
}
```

### 修改入库记录
```
PUT /api/inbound/:id
Authorization: Bearer <token>
```

### 删除入库记录
```
DELETE /api/inbound/:id
Authorization: Bearer <token>
```

## 出库管理

### 获取出库记录
```
GET /api/outbound?page=1&pageSize=10&customer_code=C001&product_model=iPhone
Authorization: Bearer <token>
```

### 新增出库记录
```
POST /api/outbound
Authorization: Bearer <token>

{
  "customer_code": "C001",
  "customer_short_name": "经销商A",
  "product_model": "iPhone 15",
  "quantity": 5,
  "unit_price": 9000.00,
  "outbound_date": "2025-08-18"
}
```

## 库存管理

### 获取库存明细
```
GET /api/stock?page=1&pageSize=10&product_model=iPhone
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "product_model": "iPhone 15",
      "current_stock": 100,
      "last_inbound": "2025-08-18",
      "last_outbound": "2025-08-17"
    }
  ],
  "total_cost_estimate": 125000.50
}
```

### 刷新库存缓存
```
POST /api/stock/refresh
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "库存缓存刷新成功",
  "updated_products": 50
}
```

### 获取库存总成本
```
GET /api/stock/total-cost-estimate
Authorization: Bearer <token>

Response:
{
  "total_cost": 125000.50,
  "last_updated": "2025-08-18T10:30:00.000Z"
}
```

## 客户供应商管理

### 获取客户供应商列表
```
GET /api/partners?type=0&search=苹果
Authorization: Bearer <token>

Query Parameters:
- type: 0=供应商, 1=客户
- search: 搜索关键词
```

### 新增客户供应商
```
POST /api/partners
Authorization: Bearer <token>

{
  "code": "S001",
  "short_name": "苹果公司",
  "full_name": "苹果电子产品商贸有限公司",
  "type": 0,
  "address": "深圳市南山区",
  "contact_person": "张经理",
  "contact_phone": "13800138000"
}
```

## 产品管理

### 获取产品列表
```
GET /api/products?category=电子产品&search=iPhone
Authorization: Bearer <token>
```

### 新增产品
```
POST /api/products
Authorization: Bearer <token>

{
  "code": "P001",
  "category": "电子产品",
  "product_model": "iPhone 15 Pro",
  "remark": "高端智能手机"
}
```

## 产品价格管理

### 获取产品价格列表
```
GET /api/product-prices?partner_short_name=苹果公司&product_model=iPhone
Authorization: Bearer <token>
```

### 获取当前有效价格
```
GET /api/product-prices/current?partner_short_name=苹果公司&product_model=iPhone&date=2025-08-18
Authorization: Bearer <token>

Response:
{
  "unit_price": 8000.00,
  "effective_date": "2025-08-01"
}
```

### 自动获取产品单价
```
GET /api/product-prices/auto?partner_short_name=苹果公司&product_model=iPhone&date=2025-08-18
Authorization: Bearer <token>
```

## 应收账款管理

### 获取应收账款列表
```
GET /api/receivable?page=1&pageSize=10&customer_code=C001
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "customer_code": "C001",
      "customer_short_name": "经销商A",
      "total_receivable": 100000.00,
      "total_paid": 60000.00,
      "balance": 40000.00
    }
  ]
}
```

### 新增回款记录
```
POST /api/receivable/payments
Authorization: Bearer <token>

{
  "customer_code": "C001",
  "amount": 10000.00,
  "pay_date": "2025-08-18",
  "pay_method": "银行转账",
  "remark": "部分回款"
}
```

### 获取客户应收详情
```
GET /api/receivable/details/:customer_code
Authorization: Bearer <token>
```

## 应付账款管理

### 获取应付账款列表
```
GET /api/payable?page=1&pageSize=10&supplier_code=S001
Authorization: Bearer <token>
```

### 新增付款记录
```
POST /api/payable/payments
Authorization: Bearer <token>

{
  "supplier_code": "S001",
  "amount": 50000.00,
  "pay_date": "2025-08-18",
  "pay_method": "银行转账"
}
```

## 概览统计

### 获取统计数据
```
GET /api/overview/stats
Authorization: Bearer <token>

Response:
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
  ]
}
```

### 刷新统计数据
```
POST /api/overview/stats
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "统计数据刷新成功"
}
```

### 获取产品本月库存变化
```
GET /api/overview/monthly-stock-change/:productModel
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "month_start_stock": 50,
    "current_stock": 30,
    "monthly_change": -20
  }
}
```

### 获取销售额前10商品
```
GET /api/overview/top-sales-products
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "product_model": "iPhone 15",
      "total_sales": 100000.00
    }
  ]
}
```

## 数据分析

### 获取分析数据
```
GET /api/analysis/data?start_date=2025-01-01&end_date=2025-01-31&customer_code=C001&product_model=iPhone
Authorization: Bearer <token>

Response:
{
  "sales_amount": 150000.00,
  "cost_amount": 120000.00,
  "profit_amount": 30000.00,
  "profit_rate": 20.00
}
```

### 获取详细分析数据
```
GET /api/analysis/detail?start_date=2025-01-01&end_date=2025-01-31&customer_code=C001
Authorization: Bearer <token>
```

### 刷新分析数据
```
POST /api/analysis/refresh
Authorization: Bearer <token>

{
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "customer_code": "C001",
  "product_model": "iPhone"
}
```

### 获取筛选选项
```
GET /api/analysis/filter-options
Authorization: Bearer <token>

Response:
{
  "customers": [
    { "code": "C001", "short_name": "经销商A" }
  ],
  "products": [
    { "product_model": "iPhone 15" }
  ]
}
```

## 导出功能

### 导出基础信息
```
POST /api/export/base-info
Authorization: Bearer <token>

{
  "exportPartners": true,
  "exportProducts": true,
  "exportPrices": true
}

Response: Excel文件流
```

### 导出入库出库记录
```
POST /api/export/inbound-outbound
Authorization: Bearer <token>

{
  "exportInbound": true,
  "exportOutbound": true,
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "productCode": "P001",
  "customerCode": "C001"
}
```

### 导出应收应付明细
```
POST /api/export/receivable-payable
Authorization: Bearer <token>
```

### 导出数据分析
```
POST /api/export/analysis
Authorization: Bearer <token>

{
  "analysisData": {...},
  "detailData": [...],
  "conditions": {...}
}
```

### 高级分析导出
```
POST /api/export/analysis/advanced
Authorization: Bearer <token>

{
  "exportType": "by_customer", // 或 "by_product"
  "startDate": "2025-01-01",
  "endDate": "2025-01-31"
}
```

## 错误码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权/Token无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": {...},
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "error": "错误描述",
  "code": "ERROR_CODE"
}
```

---

*本文档最后更新: 2025年8月*
