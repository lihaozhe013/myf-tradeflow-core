
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

### BATCH UPDATE
POST /api/outbound/batch

Authorization: Bearer <token>

Batch update multiple outbound records. Only provided fields will be updated, empty/null fields will be ignored.

```json
{
  "ids": [1, 2, 3],
  "updates": {
    "customer_code": "C002",
    "customer_short_name": "Company B",
    "unit_price": 8500.00,
    "outbound_date": "2025-08-20"
  }
}
```

**Request Body:**
- `ids` (required): Array of record IDs to update
- `updates` (required): Object containing fields to update. Only provided fields will be updated:
  - `customer_code`: Customer code
  - `customer_short_name`: Customer short name
  - `customer_full_name`: Customer full name
  - `product_code`: Product code
  - `product_model`: Product model
  - `quantity`: Quantity (will recalculate total_price)
  - `unit_price`: Unit price (will recalculate total_price)
  - `outbound_date`: Outbound date
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