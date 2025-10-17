## `/api/stock`

### GET
GET /api/stock?page=1&pageSize=10&product_model=iPhone

Authorization: Bearer <token>

Response:
```json
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