## `/api/export/base-info`
### POST
POST /api/export/base-info

Authorization: Bearer <token>
```json
{
  "exportPartners": true,
  "exportProducts": true,
  "exportPrices": true
}
```
Response: Excel文件流


## `/api/export/inbound-outbound`
### POST
POST /api/export/inbound-outbound

Authorization: Bearer <token>
```json
{
  "exportInbound": true,
  "exportOutbound": true,
  "startDate": "2025-01-01",
  "endDate": "2025-01-31",
  "productCode": "P001",
  "customerCode": "C001"
}
```

## `/api/export/receivable-payable`
### POST
POST /api/export/receivable-payable

Authorization: Bearer <token>


## `/api/export/analysis`
### POST

POST /api/export/analysis
Authorization: Bearer <token>
```json
{
  "analysisData": {...},
  "detailData": [...],
  "conditions": {...}
}
```

## `/api/export/analysis/advanced`
### POST

POST /api/export/analysis/advanced
Authorization: Bearer <token>
```json
{
  "exportType": "by_customer", // 或 "by_product"
  "startDate": "2025-01-01",
  "endDate": "2025-01-31"
}
```