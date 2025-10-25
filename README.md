# MYF Tradeflow Core

A lightweight tradeflow system designed for small businesses, built with React.js based frontend and Node.js + SQLite based backend.

Originally developed for a relative’s family business (myf), it is now open‑sourced on GitHub.

The system was developed in a Chinese-language environment and extensively utilizes LLM for development support. Please note that English documentation is currently unavailable.

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
## ⚡ Quick Start

### Prerequisites

- Node.js 22+
- npm

### Installation

1.  **Clone the project**:

```bash
git clone [https://github.com/lihaozhe013/myf-tradeflow-core.git](https://github.com/lihaozhe013/myf-tradeflow-core.git)
cd myf-tradeflow-core
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

## Docker
To create docker image, first build the project
```bash
npm run build
```
Then
```
docker build -t myf-tradeflow:1.0 .
```

## Data Files
The system uses JSON configuration files located in the `data/` directory:

- `appConfig.json`: Application settings and company information
- `exportConfig.json`: Data export templates and settings
- `data.db`: SQLite database file
