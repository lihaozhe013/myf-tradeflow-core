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