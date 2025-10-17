## `/api/stock/refresh`

### POST
POST /api/stock/refresh

Authorization: Bearer <token>

Response:
```json
{
  "success": true,
  "message": "库存缓存刷新成功",
  "updated_products": 50
}
```