## `/api/receivable`
### GET
GET /api/receivable?page=1&pageSize=10&customer_code=C001

Authorization: Bearer <token>

Response:
```json
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

## `/api/receivable/payments`
### POST
POST /api/receivable/payments

Authorization: Bearer <token>
```json
{
  "customer_code": "C001",
  "amount": 10000.00,
  "pay_date": "2025-08-18",
  "pay_method": "银行转账",
  "remark": "部分回款"
}
```

## `/api/receivable/details`
### GET

GET /api/receivable/details/:customer_code

Authorization: Bearer <token>

## `/api/receivable/uninvoiced/:customer_code`
### GET
Get uninvoiced outbound records for a specific customer (records where invoice_number is NULL or empty).

GET /api/receivable/uninvoiced/:customer_code?page=1&limit=10

Authorization: Bearer <token>

**Query Parameters:**
- `page` (optional): Page number, default is 1
- `limit` (optional): Records per page, default is 10

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "customer_code": "C001",
      "customer_short_name": "经销商A",
      "customer_full_name": "经销商A有限公司",
      "product_code": "P001",
      "product_model": "Model X",
      "quantity": 100,
      "unit_price": 50.00,
      "total_price": 5000.00,
      "outbound_date": "2025-11-15",
      "invoice_date": null,
      "invoice_number": null,
      "invoice_image_url": null,
      "order_number": "ORD001",
      "remark": ""
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

## `/api/receivable/invoiced/:customer_code`
### GET
Get invoiced records grouped by invoice_number for a specific customer (from cache). Each invoice_number appears only once with aggregated total amount.

GET /api/receivable/invoiced/:customer_code?page=1&limit=10

Authorization: Bearer <token>

**Query Parameters:**
- `page` (optional): Page number, default is 1
- `limit` (optional): Records per page, default is 10

**Response:**
```json
{
  "data": [
    {
      "invoice_number": "INV20251115001",
      "invoice_date": "2025-11-15",
      "total_amount": 15000.00,
      "record_count": 3
    },
    {
      "invoice_number": "INV20251114001",
      "invoice_date": "2025-11-14",
      "total_amount": 8500.00,
      "record_count": 2
    }
  ],
  "total": 10,
  "page": 1,
  "limit": 10,
  "last_updated": "2025-11-18T10:30:45.123Z"
}
```

**Note:** If cache is not initialized, the API will return a 404 error with message asking to refresh the cache first.

## `/api/receivable/invoices/refresh/:customer_code`
### POST
Refresh the invoice cache for a specific customer. This endpoint recalculates all invoiced records by querying the database and updating the cache file.

POST /api/receivable/invoices/refresh/:customer_code

Authorization: Bearer <token>

**Response:**
```json
{
  "message": "Invoice cache refreshed successfully",
  "total": 10,
  "last_updated": "2025-11-18T10:35:20.456Z",
  "data": [
    {
      "invoice_number": "INV20251115001",
      "invoice_date": "2025-11-15",
      "total_amount": 15000.00,
      "record_count": 3
    }
  ]
}
```

**Note:** The cache is stored in `/data/invoice-cache.json` and persists across server restarts.