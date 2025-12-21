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
  API --> Services{{Domain Services\nInventory / Partners / Pricing / Finance / Reports}}
  Services --> DB[(SQLite)]
  Services --> Config[data/ config JSON]
  API --> Logging[Winston Logs]
```

## Database Schema (Backend)

```mermaid
erDiagram
  PARTNERS ||--o{ INBOUND_RECORDS : supplies
  PARTNERS ||--o{ OUTBOUND_RECORDS : receives
  PARTNERS ||--o{ PRODUCT_PRICES : negotiates
  PARTNERS ||--o{ RECEIVABLE_PAYMENTS : customer
  PARTNERS ||--o{ PAYABLE_PAYMENTS : supplier
  PRODUCTS ||--o{ INBOUND_RECORDS : sku
  PRODUCTS ||--o{ OUTBOUND_RECORDS : sku
  PRODUCTS ||--o{ PRODUCT_PRICES : has

  PARTNERS {
    TEXT code UNIQUE "business key / FK target"
    TEXT short_name PK "database PK (legacy)"
    TEXT full_name
    INTEGER type
  }
  PRODUCTS {
    INTEGER rowid PK "implicit SQLite rowid"
    TEXT code UNIQUE "business key / FK target"
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
>
> Key usage summary:
> - Declared database PK: `PARTNERS.short_name` (legacy) because historical datasets and pricing were keyed to short names; re-keying is deferred (no migration scheduled in this repo) to avoid data migration risk.
> - Business/lookup key: `PARTNERS.code` (unique); columns `supplier_code` and `customer_code` store this value to keep payable vs receivable roles explicit.
> - Pricing keeps `PRODUCT_PRICES.partner_short_name` (matching `PARTNERS.short_name`) for backward compatibility; migrating pricing to use `code` is deferred to avoid breaking existing exports.
> - `PRODUCTS` surfaces SQLite's implicit integer `rowid` as the table PK (shown above) while `code` remains the business identifier used in services and FKs.
> - Mixed FK naming (`partner_short_name` vs. `supplier_code`/`customer_code`) is preserved intentionally for backward compatibility; new extensions should standardize on a `partner_code` column referencing `PARTNERS.code` unless interoperating with legacy price data.

## API Overview

- **Base URL**: `/api`
- **Auth**: `POST /api/login` returns a JWT; include `Authorization: Bearer <token>` in subsequent requests.
- **Response format**: JSON with `success`/`message` fields where applicable.
- **Full docs**: See `docs/api/` for per-endpoint request/response bodies.

Key endpoints (high level):

| Area | Method & Path | Purpose |
| --- | --- | --- |
| Auth | `POST /api/login` | Exchange credentials for JWT |
| Overview | `GET /api/overview/stats` | Fetch dashboard metrics |
| Overview | `POST /api/overview/stats` | Trigger metrics recomputation |
| Products | `/api/products` (GET, POST, PUT, DELETE) | CRUD endpoints for product catalog |
| Partners | `/api/partners` (GET, POST, PUT, DELETE) | CRUD endpoints for customers/suppliers |
| Pricing | `/api/product-prices` (GET, POST, PUT, DELETE) | CRUD partner-specific product prices (also see `/current` and `/auto` helpers) |
| Inventory Inbound | `/api/inbound` (GET, POST, PUT, DELETE); `POST /api/inbound/batch` | Receive goods and perform batch updates |
| Inventory Outbound | `/api/outbound` (GET, POST, PUT, DELETE); `POST /api/outbound/batch` | Ship goods and perform batch updates |
| Stock | `GET /api/stock` | Real-time stock summary by product |
| Finance - Receivable | `/api/receivable/payments` (GET, POST, PUT, DELETE) | Track customer payments |
| Finance - Payable | `/api/payable/payments` (GET, POST, PUT, DELETE) | Track supplier payments |
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
