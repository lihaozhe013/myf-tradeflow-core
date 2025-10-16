## `/api/analysis/data`
### GET
GET /api/analysis/data?start_date=2025-01-01&end_date=2025-01-31&customer_code=C001&product_model=iPhone

Authorization: Bearer <token>

Response:
```json
{
  "sales_amount": 150000.00,
  "cost_amount": 120000.00,
  "profit_amount": 30000.00,
  "profit_rate": 20.00
}
```

## `/api/analysis/detail`
### GET

GET /api/analysis/detail?start_date=2025-01-01&end_date=2025-01-31&customer_code=C001

Authorization: Bearer <token>

## `/api/analysis/refresh`
### POST

POST /api/analysis/refresh

Authorization: Bearer <token>
```json
{
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "customer_code": "C001",
  "product_model": "iPhone"
}
```

## `/api/analysis/filter-options`
### GET

GET /api/analysis/filter-options
Authorization: Bearer <token>

Response:
```json
{
  "customers": [
    { "code": "C001", "short_name": "经销商A" }
  ],
  "products": [
    { "product_model": "iPhone 15" }
  ]
}
```