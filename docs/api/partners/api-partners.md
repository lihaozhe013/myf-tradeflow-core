## `/api/partners`

### GET
GET /api/partners?type=0&search=PartnerName1

Authorization: Bearer <token>

Query Parameters:
- type: 0=supplier, 1=customer
- search: keyword

### POST
POST /api/partners

Authorization: Bearer <token>
```json
{
  "code": "S001",
  "short_name": "苹果公司",
  "full_name": "苹果电子产品商贸有限公司",
  "type": 0,
  "address": "深圳市南山区",
  "contact_person": "张经理",
  "contact_phone": "13800138000"
}
```