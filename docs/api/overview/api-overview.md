## `/api/overview/stats`
### GET
GET /api/overview/stats

Authorization: Bearer <token>

Response:
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
  ]
}
```

### POST
POST /api/overview/stats

Authorization: Bearer <token>

Response:
```json
{
  "success": true,
  "message": "统计数据刷新成功"
}
```

## `/api/overview/monthly-stock-change`
### GET
GET /api/overview/monthly-stock-change/:productModel

Authorization: Bearer <token>

Response:
```json
{
  "success": true,
  "data": {
    "month_start_stock": 50,
    "current_stock": 30,
    "monthly_change": -20
  }
}
```


## `/api/overview/top-sales-products`
### GET
GET /api/overview/top-sales-products

Authorization: Bearer <token>

Response:
```json
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