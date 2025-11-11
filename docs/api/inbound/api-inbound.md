## `/api/inbound`

### GET

GET /api/inbound?page=1&pageSize=10&customer_code=C001&product_model=iPhone

Authorization: Bearer <token>

### POST
POST /api/inbound

Authorization: Bearer <token>
```json
{
  "supplier_code": "C001",
  "supplier_short_name": "Company A",
  "product_model": "Product A",
  "quantity": 5,
  "unit_price": 9000.00,
  "inbound_date": "2025-08-18"
}
```

### PUT
PUT /api/inbound/:id

Authorization: Bearer <token>
```json
{
  "supplier_code": "C001",
  "supplier_short_name": "Company A",
  "product_model": "Product A",
  "quantity": 5,
  "unit_price": 9000.00,
  "inbound_date": "2025-08-18"
}
```

### DELETE
DELETE /api/inbound/:id

Authorization: Bearer <token>