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

### BATCH UPDATE
POST /api/inbound/batch

Authorization: Bearer <token>

Batch update multiple inbound records. Only provided fields will be updated, empty/null fields will be ignored.

```json
{
  "ids": [1, 2, 3],
  "updates": {
    "supplier_code": "C002",
    "supplier_short_name": "Company B",
    "unit_price": 8500.00,
    "inbound_date": "2025-08-20"
  }
}
```

**Request Body:**
- `ids` (required): Array of record IDs to update
- `updates` (required): Object containing fields to update. Only provided fields will be updated:
  - `supplier_code`: Supplier code
  - `supplier_short_name`: Supplier short name
  - `supplier_full_name`: Supplier full name
  - `product_code`: Product code
  - `product_model`: Product model
  - `quantity`: Quantity (will recalculate total_price)
  - `unit_price`: Unit price (will recalculate total_price)
  - `inbound_date`: Inbound date
  - `invoice_date`: Invoice date
  - `invoice_number`: Invoice number
  - `invoice_image_url`: Invoice image URL
  - `order_number`: Order number
  - `remark`: Remark

**Response:**
```json
{
  "message": "Batch update completed!",
  "updated": 3,
  "notFound": []
}
```