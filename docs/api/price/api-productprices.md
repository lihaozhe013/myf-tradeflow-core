## `/api/product-prices`
### GET
GET /api/product-prices?partner_short_name=苹果公司&product_model=iPhone

Authorization: Bearer <token>

## `/api/product-prices/current`
### GET
GET /api/product-prices/current?partner_short_name=苹果公司&product_model=iPhone&date=2025-08-18

Authorization: Bearer <token>

Response:
```json
{
  "unit_price": 8000.00,
  "effective_date": "2025-08-01"
}
```

## `/api/product-prices/auto`
### GET
GET /api/product-prices/auto?partner_short_name=苹果公司&product_model=iPhone&date=2025-08-18

Authorization: Bearer <token>