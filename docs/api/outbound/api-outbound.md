
## `/api/outbound`
### GET
GET /api/outbound?page=1&pageSize=10&customer_code=C001&product_model=iPhone

Authorization: Bearer <token>

### POST
POST /api/outbound

Authorization: Bearer <token>
```json
{
  "customer_code": "C001",
  "customer_short_name": "Company A",
  "product_model": "Product A",
  "quantity": 5,
  "unit_price": 9000.00,
  "outbound_date": "2025-08-18"
}
```

### PUT
POST /api/outbound/:id

Authorization: Bearer <token>
```json
{
  "customer_code": "C001",
  "customer_short_name": "Company A",
  "product_model": "Product A",
  "quantity": 5,
  "unit_price": 9000.00,
  "outbound_date": "2025-08-18"
}
```

### DELETE
DELETE /api/outbound/:id

Authorization: Bearer <token>