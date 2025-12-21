# Tradeflow Core

A lightweight tradeflow system designed for small businesses, built with React.js based frontend and Node.js + SQLite based backend.

## Key Features

- **Inventory Management**: Track inventory levels, inbound and outbound operations
- **Product Management**: Manage product information and pricing strategies
- **Financial Tracking**: Monitor accounts payable and accounts receivable
- **Sales Analysis**: Generate reports and analyze sales data
- **Multi-language Support**: Supports English, Korean, and Chinese
- **Data Export**: Supports data export in Excel format
- **JWT Authentication**: Stateless authentication system
- **Role Based Access Control**: Can assign **Editor** and **Viewer** to each user

## Tech Stack

- **Frontend**: React 19, Vite, Ant Design, TypeScript
- **Backend**: Node.js, Express, SQLite3, TypeScript
- **Authentication**: JWT stateless authentication
- **Styling**: CSS3, Ant Design component library
- **Logging**: Winston logging system
- **Precise Calculations**: Decimal.js for precise numerical calculations

## Backend Architecture Overview

```mermaid
flowchart LR
  Frontend[React SPA (Vite)] -->|HTTPS /api| API[Express REST API]
  API --> Auth[JWT Auth + RBAC]
  API --> Services{{Domain Services\\nInventory / Partners / Pricing / Finance / Reports}}
  Services --> DB[(SQLite)]
  Services --> Config[data/ config JSON]
  API --> Logging[Winston Logs]
```

## Database Schema (Backend)

```mermaid
erDiagram
  PARTNERS ||--o{ INBOUND_RECORDS : supplies
  PARTNERS ||--o{ OUTBOUND_RECORDS : purchases
  PARTNERS ||--o{ PRODUCT_PRICES : negotiates
  PARTNERS ||--o{ RECEIVABLE_PAYMENTS : customer
  PARTNERS ||--o{ PAYABLE_PAYMENTS : supplier
  PRODUCTS ||--o{ INBOUND_RECORDS : sku
  PRODUCTS ||--o{ OUTBOUND_RECORDS : sku
  PRODUCTS ||--o{ PRODUCT_PRICES : has

  PARTNERS {
    TEXT code
    TEXT short_name PK
    TEXT full_name
    INTEGER type
  }
  PRODUCTS {
    TEXT code UNIQUE
    TEXT category
    TEXT product_model
    TEXT remark
  }
  PRODUCT_PRICES {
    INTEGER id PK
    TEXT partner_short_name FK
    TEXT product_model FK
    TEXT effective_date
    REAL unit_price
  }
  INBOUND_RECORDS {
    INTEGER id PK
    TEXT supplier_code FK
    TEXT product_model FK
    INTEGER quantity
    REAL unit_price
    REAL total_price
    TEXT inbound_date
  }
  OUTBOUND_RECORDS {
    INTEGER id PK
    TEXT customer_code FK
    TEXT product_model FK
    INTEGER quantity
    REAL unit_price
    REAL total_price
    TEXT outbound_date
  }
  RECEIVABLE_PAYMENTS {
    INTEGER id PK
    TEXT customer_code FK
    REAL amount
    TEXT pay_date
    TEXT pay_method
  }
  PAYABLE_PAYMENTS {
    INTEGER id PK
    TEXT supplier_code FK
    REAL amount
    TEXT pay_date
    TEXT pay_method
  }
```

> Partner `type`: `0` = supplier, `1` = customer.

## API Overview

- **Base URL**: `/api`
- **Auth**: `POST /api/login` returns a JWT; include `Authorization: Bearer <token>` in subsequent requests.
- **Response format**: JSON with `success`/`message` fields where applicable.
- **Full docs**: See `docs/api/` for per-endpoint request/response bodies.

| Area | Method & Path | Purpose |
| --- | --- | --- |
| Auth | `POST /api/login` | Exchange credentials for JWT |
| Overview | `GET /api/overview/stats`, `POST /api/overview/stats` | Dashboard metrics & refresh |
| Products | `GET/POST/PUT/DELETE /api/products` | CRUD product catalog |
| Partners | `GET/POST/PUT/DELETE /api/partners` | Manage customers/suppliers |
| Pricing | `GET/POST/PUT/DELETE /api/prices` | Partner-specific product prices |
| Inventory Inbound | `GET/POST/PUT/DELETE /api/inbound`, `POST /api/inbound/batch` | Receive goods and batch updates |
| Inventory Outbound | `GET/POST/PUT/DELETE /api/outbound`, `POST /api/outbound/batch` | Ship goods and batch updates |
| Stock | `GET /api/stock` | Real-time stock summary by product |
| Finance - Receivable | `GET/POST/PUT/DELETE /api/receivable/payments` | Track customer payments |
| Finance - Payable | `GET/POST/PUT/DELETE /api/payable/payments` | Track supplier payments |
| Export | `GET /api/export/:type` | Export configured datasets (e.g., Excel) |

## Demo

This is the detailed page for my demo link:
[My Demo](https://lihaozhe013.github.io/lihaozhe-website/posts/tradeflow-system/)

![1.png](https://lihaozhe013.github.io/lihaozhe-website/posts/tradeflow-system/1.png)

![2.png](https://lihaozhe013.github.io/lihaozhe-website/posts/tradeflow-system/2.png)

![3.png](https://lihaozhe013.github.io/lihaozhe-website/posts/tradeflow-system/3.png)

![4.png](https://lihaozhe013.github.io/lihaozhe-website/posts/tradeflow-system/4.png)

![5.png](https://lihaozhe013.github.io/lihaozhe-website/posts/tradeflow-system/5.png)

![6.png](https://lihaozhe013.github.io/lihaozhe-website/posts/tradeflow-system/6.png)

![7.png](https://lihaozhe013.github.io/lihaozhe-website/posts/tradeflow-system/7.png)
## Quick Start

### Prerequisites

- Node.js 22+
- npm
- Docker (Optional)
### Development (Without Docker)

1.  **Clone the project**:

```bash
git clone [https://github.com/lihaozhe013/tradeflow-core.git](https://github.com/lihaozhe013/tradeflow-core.git)
cd tradeflow-core
```

2.  **Install dependencies**:

```bash
npm run install:all
```

3.  **Set up configuration**:

```bash
# Copy the example configuration files
mkdir -p data
cp -r config-example/* data/
```

4. **Init**:

```bash
npm run build
```

5.  **Start the development servers**:

```bash
# Start the dev server()
npm run dev
```

### Development (With Docker)
#### All in one command (build image and start image)
```bash
make build
```

#### Start
```bash
make start
```

#### Stop
```bash
make stop
```

#### Use shell in docker
```bash
make sh
```

## Production Deployment
First, ensure that a functional build artifact is available
```bash
npm run build
cd dist # dist stores the complete frontend and backend build artifacts
mkdir -p data
cp -r ../config-example/* data/
cd ..
```

To start the server
```bash
cd dist
NODE_ENV=production node ./backend/server.js 
```


For production deployment with PM2 cluster mode:
```bash
cd dist/pm2
./stop-pm2.sh
./start-pm2.sh
```
This will:
- Shut down the previously running process
- Install PM2 globally (if not installed)
- Build the frontend application
- Start backend services with cluster mode (max instances)
- Configure logging and auto-restart

> Internal access logs have been simplified. If you require detailed access logs, I recommend using Nginx as a proxy and reviewing Nginx's logs.

### Docker (Prod)
To create docker image, first build the project
```bash
npm run build
```
Then
```
docker build -t tradeflow-core:1.0 .
```

## Data Files
The system uses JSON configuration files located in the `data/` directory:

- `appConfig.json`: Application settings and company information
- `exportConfig.json`: Data export templates and settings
- `data.db`: SQLite database file
