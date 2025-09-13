Of course, here is the English translation of the document you provided.

# MyF Lightweight ERP System

A lightweight Enterprise Resource Planning (ERP) system designed for small businesses, built with React, Node.js, and SQLite.

## 🚀 Key Features

  - **Inventory Management**: Track stock levels, inbound and outbound operations
  - **Product Management**: Manage product information and pricing strategies
  - **Financial Tracking**: Monitor accounts payable and accounts receivable
  - **Sales Analysis**: Generate reports and analyze sales data
  - **Multi-language Support**: Supports English, Korean, and Chinese
  - **Data Export**: Supports data export in Excel format
  - **JWT Authentication**: Stateless authentication system

## 🛠 Tech Stack

  - **Frontend**: React 19, Vite, Ant Design
  - **Backend**: Node.js, Express, SQLite3
  - **Authentication**: JWT stateless authentication
  - **Styling**: CSS3, Ant Design component library
  - **Logging**: Winston logging system
  - **Precise Calculations**: Decimal.js for precise numerical calculations

## ⚡ Quick Start

### Prerequisites

  - Node.js 20+
  - npm

### Installation

1.  **Clone the project**:

    ```bash
    git clone <repository-url>
    cd myf-lightweight-ERP-system
    ```

2.  **Install dependencies**:

    ```bash
    # Install backend dependencies
    cd backend
    npm install

    # Install frontend dependencies
    cd ../frontend
    npm install
    ```

3.  **Set up configuration**:

    ```bash
    # Copy the example configuration files
    cp -r config-example/* data/
    ```

4.  **Initialize the database**:

    ```bash
    cd backend
    npm run init-db
    ```

5.  **Start the development servers**:

    ```bash
    # Start the backend service (in the backend directory)
    npm run dev

    # Start the frontend service (in the frontend directory, in a new terminal)
    cd ../frontend
    npm run dev
    ```

The application will be available at the following addresses:

  - Frontend: http://localhost:5173
  - Backend API: http://localhost:3000

## 🚀 Production Deployment

For production deployment with PM2 cluster mode:

```bash
# One-click production deployment
./scripts/production/start-prod.sh
```

This will:
- Install PM2 globally (if not installed)
- Build the frontend application
- Start backend services with cluster mode (max instances)
- Configure logging and auto-restart

See [PM2 Deployment Guide](docs/pm2-deployment.md) for detailed instructions.

## 📁 Project Structure

```
myf-lightweight-ERP-system/
├── backend/            # Node.js backend server
│   ├── routes/         # API routes
│   └── utils/          # Utility functions and middleware
├── frontend/           # React frontend application
│   ├── src/            # Source code
│   └── public/         # Static assets
├── scripts/            # Deployment and automation scripts
│   └── production/     # Production deployment scripts (PM2)
├── data/               # Database and configuration files
├── config-example/     # Example configuration files
└── docs/               # Project documentation
```

## 📚 Documentation

Complete project documentation can be found in the `docs/` directory:

  - **[Development Documentation Overview](https://www.google.com/search?q=docs/README-DEV.md)** - Developer documentation navigation and quick start
  - **[Project Architecture](https://www.google.com/search?q=docs/project-structure.md)** - Tech stack, directory structure, and configuration management
  - **[Database Design](https://www.google.com/search?q=docs/database-design.md)** - Data models, table structures, and relationships
  - **[API Reference](https://www.google.com/search?q=docs/api-reference.md)** - Complete REST API documentation
  - **[Authentication System](https://www.google.com/search?q=docs/authentication.md)** - JWT authentication architecture and security mechanisms
  - **[Precise Calculations](https://www.google.com/search?q=docs/decimal-calculation.md)** - Architecture for precise financial calculations
  - **[Business Logic](https://www.google.com/search?q=docs/business-logic.md)** - Core business rules and algorithms
  - **[Frontend Components](https://www.google.com/search?q=docs/frontend-components.md)** - React component design and development standards
  - **[Data Analysis](https://www.google.com/search?q=docs/analysis-features.md)** - Sales analysis features and algorithms
  - **[Data Export](https://www.google.com/search?q=docs/export-features.md)** - Excel export functionality and template system
  - **[Logging Management](https://www.google.com/search?q=docs/logging.md)** - Logging and monitoring system
  - **[Development Tools](https://www.google.com/search?q=docs/development-tools.md)** - Development environment and workflow
  - **[PM2 Production Deployment](https://www.google.com/search?q=docs/pm2-deployment.md)** - Production deployment with PM2 cluster mode

## ⚙️ Configuration Management

The system uses JSON configuration files located in the `data/` directory:

  - `appConfig.json`: Application settings and company information
  - `exportConfig.json`: Data export templates and settings
  - `data.db`: SQLite database file