# 日志管理系统

## 系统概述

日志管理系统提供应用程序运行状态监控、错误追踪、访问记录和调试信息记录功能。采用Winston日志框架，支持分级记录、文件轮转和结构化输出。

## 日志架构

### 核心组件
- **日志器 (Logger)**: 统一的日志记录接口
- **日志中间件 (Middleware)**: Express请求/响应日志记录
- **文件管理**: 自动轮转和存档机制
- **格式化器**: 结构化日志输出格式

### 目录结构
```
backend/utils/
├── logger.js              # 日志器配置和初始化
└── loggerMiddleware.js     # Express日志中间件

data/log/
├── app.log                 # 应用程序日志
├── error.log              # 错误日志
├── access.log             # 访问日志
└── archived/              # 归档日志目录
    ├── app.log.2025-01-17
    ├── error.log.2025-01-17
    └── access.log.2025-01-17
```

## 日志级别

### 级别定义
```javascript
const logLevels = {
  error: 0,    // 错误信息 - 系统错误、异常
  warn: 1,     // 警告信息 - 潜在问题、性能警告
  info: 2,     // 信息记录 - 重要操作、状态变更
  debug: 3,    // 调试信息 - 详细执行流程
  verbose: 4,  // 详细信息 - 内部状态、变量值
  silly: 5     // 最详细 - 全部调试信息
};
```

### 使用指南
- **error**: 数据库连接失败、文件操作错误、API调用异常
- **warn**: 库存不足警告、性能阈值超标、弃用功能使用
- **info**: 用户登录、数据导出、配置更新、系统启动
- **debug**: 查询执行、计算过程、业务逻辑判断
- **verbose**: 变量赋值、循环执行、函数调用
- **silly**: 全部执行细节、中间变量状态

## 日志配置

### Winston配置 (logger.js)
```javascript
const winston = require('winston');
const path = require('path');

// 确保日志目录存在
const logDir = path.join(__dirname, '../../data/log');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  
  // 默认元数据
  defaultMeta: { 
    service: 'myf-erp',
    version: process.env.npm_package_version || '1.0.0'
  },
  
  // 传输器配置
  transports: [
    // 应用程序日志
    new winston.transports.File({
      filename: path.join(logDir, 'app.log'),
      level: 'info',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 30,
      tailable: true
    }),
    
    // 错误日志
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 30,
      tailable: true
    }),
    
    // 访问日志
    new winston.transports.File({
      filename: path.join(logDir, 'access.log'),
      level: 'info',
      maxsize: 10 * 1024 * 1024,
      maxFiles: 30,
      tailable: true,
      // 自定义格式用于访问日志
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `${timestamp} [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
        })
      )
    })
  ],
  
  // 异常处理
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'exceptions.log')
    })
  ],
  
  // 拒绝处理
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logDir, 'rejections.log')
    })
  ]
});

// 开发环境控制台输出
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

module.exports = logger;
```

### 环境配置
```bash
# .env 文件
LOG_LEVEL=info          # 生产环境
LOG_LEVEL=debug         # 开发环境
LOG_LEVEL=verbose       # 调试环境
```

## 日志中间件

### Express中间件 (loggerMiddleware.js)
```javascript
const logger = require('./logger');

// 访问日志中间件
const accessLogger = (req, res, next) => {
  const start = Date.now();
  
  // 记录请求开始
  logger.info('Request started', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: req.id || generateRequestId()
  });
  
  // 响应结束时记录
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: data ? data.length : 0,
      requestId: req.id
    });
    
    originalSend.call(this, data);
  };
  
  next();
};

// 错误日志中间件
const errorLogger = (err, req, res, next) => {
  logger.error('Request error', {
    error: {
      message: err.message,
      stack: err.stack,
      code: err.code
    },
    request: {
      method: req.method,
      url: req.url,
      body: req.body,
      params: req.params,
      query: req.query
    },
    requestId: req.id
  });
  
  next(err);
};

// 请求ID生成器
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// 请求ID中间件
const requestIdMiddleware = (req, res, next) => {
  req.id = generateRequestId();
  res.setHeader('X-Request-ID', req.id);
  next();
};

module.exports = {
  accessLogger,
  errorLogger,
  requestIdMiddleware
};
```

### 中间件使用
```javascript
// server.js
const { accessLogger, errorLogger, requestIdMiddleware } = require('./utils/loggerMiddleware');

app.use(requestIdMiddleware);  // 生成请求ID
app.use(accessLogger);         // 访问日志
// ... 其他路由和中间件
app.use(errorLogger);          // 错误日志 (在路由之后)
```

## 业务日志记录

### 数据库操作日志
```javascript
// 查询日志
const executeQuery = (query, params) => {
  logger.debug('Database query', {
    query: query.replace(/\s+/g, ' ').trim(),
    params: params,
    operation: 'database'
  });
  
  try {
    const result = db.prepare(query).all(params);
    logger.debug('Query completed', {
      rowCount: result.length,
      operation: 'database'
    });
    return result;
  } catch (error) {
    logger.error('Database query failed', {
      error: error.message,
      query: query,
      params: params,
      operation: 'database'
    });
    throw error;
  }
};
```

### API操作日志
```javascript
// 控制器日志示例
app.get('/api/products', (req, res) => {
  logger.info('Products API called', {
    query: req.query,
    operation: 'api_call'
  });
  
  try {
    const products = getProducts(req.query);
    
    logger.info('Products retrieved successfully', {
      count: products.length,
      operation: 'api_success'
    });
    
    res.json(products);
  } catch (error) {
    logger.error('Products API failed', {
      error: error.message,
      query: req.query,
      operation: 'api_error'
    });
    
    res.status(500).json({ error: 'Internal server error' });
  }
});
```

### 业务逻辑日志
```javascript
// 库存更新日志
const updateStock = (productModel, quantity, operation) => {
  logger.info('Stock update started', {
    productModel,
    quantity,
    operation,
    business: 'stock_management'
  });
  
  try {
    const currentStock = getCurrentStock(productModel);
    logger.debug('Current stock retrieved', {
      productModel,
      currentStock,
      business: 'stock_management'
    });
    
    const newStock = currentStock + quantity;
    
    if (newStock < 0) {
      logger.warn('Stock would go negative', {
        productModel,
        currentStock,
        requestedChange: quantity,
        business: 'stock_warning'
      });
      throw new Error('Insufficient stock');
    }
    
    updateStockRecord(productModel, newStock);
    
    logger.info('Stock updated successfully', {
      productModel,
      oldStock: currentStock,
      newStock,
      change: quantity,
      business: 'stock_management'
    });
    
  } catch (error) {
    logger.error('Stock update failed', {
      error: error.message,
      productModel,
      quantity,
      operation,
      business: 'stock_error'
    });
    throw error;
  }
};
```

### 认证日志
```javascript
// JWT认证日志
const authenticateToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    logger.warn('Authentication failed - no token', {
      ip: req.ip,
      url: req.url,
      security: 'auth_failure'
    });
    return res.status(401).json({ error: 'Access denied' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    
    logger.info('Authentication successful', {
      userId: decoded.id,
      ip: req.ip,
      url: req.url,
      security: 'auth_success'
    });
    
    next();
  } catch (error) {
    logger.warn('Authentication failed - invalid token', {
      error: error.message,
      ip: req.ip,
      url: req.url,
      security: 'auth_failure'
    });
    res.status(401).json({ error: 'Invalid token' });
  }
};
```

## 日志格式

### 结构化日志格式
```json
{
  "timestamp": "2025-01-18 14:30:25",
  "level": "info",
  "message": "Stock updated successfully",
  "service": "myf-erp",
  "version": "1.0.0",
  "productModel": "iPhone 15",
  "oldStock": 100,
  "newStock": 95,
  "change": -5,
  "business": "stock_management",
  "requestId": "req_1642518625000_abc123def"
}
```

### 访问日志格式
```
2025-01-18 14:30:25 [INFO] Request completed {"method":"GET","url":"/api/products","statusCode":200,"duration":"45ms","contentLength":1234,"requestId":"req_1642518625000_abc123def"}
```

### 错误日志格式
```json
{
  "timestamp": "2025-01-18 14:30:25",
  "level": "error",
  "message": "Database query failed",
  "service": "myf-erp",
  "error": {
    "message": "SQLITE_ERROR: no such table: invalid_table",
    "stack": "Error: SQLITE_ERROR...\n    at Database.prepare...",
    "code": "SQLITE_ERROR"
  },
  "query": "SELECT * FROM invalid_table",
  "params": [],
  "operation": "database",
  "requestId": "req_1642518625000_abc123def"
}
```

## 日志轮转

### 自动轮转配置
```javascript
// 文件轮转设置
const rotateConfig = {
  maxsize: 10 * 1024 * 1024,  // 10MB
  maxFiles: 30,               // 保留30个文件
  tailable: true,             // 可追踪的日志
  zippedArchive: false        // 不压缩归档
};
```

### 手动轮转脚本
```bash
#!/bin/bash
# rotate-logs.sh

LOG_DIR="/path/to/data/log"
ARCHIVE_DIR="${LOG_DIR}/archived"
DATE=$(date +%Y-%m-%d)

# 创建归档目录
mkdir -p "${ARCHIVE_DIR}"

# 轮转日志文件
for log_file in app.log error.log access.log; do
  if [ -f "${LOG_DIR}/${log_file}" ]; then
    mv "${LOG_DIR}/${log_file}" "${ARCHIVE_DIR}/${log_file}.${DATE}"
    touch "${LOG_DIR}/${log_file}"
    echo "Rotated ${log_file}"
  fi
done

# 删除30天前的归档
find "${ARCHIVE_DIR}" -name "*.log.*" -mtime +30 -delete

echo "Log rotation completed"
```

## 日志分析

### 常用查询命令
```bash
# 查看错误日志
tail -f data/log/error.log

# 统计今天的错误数量
grep "$(date +%Y-%m-%d)" data/log/error.log | wc -l

# 查找特定操作的日志
grep "stock_management" data/log/app.log

# 分析API响应时间
grep "Request completed" data/log/access.log | grep -o '"duration":"[^"]*"' | sort

# 查找认证失败记录
grep "auth_failure" data/log/app.log
```

### 日志监控脚本
```javascript
// log-monitor.js
const fs = require('fs');
const path = require('path');

const monitorLogs = () => {
  const logFiles = ['app.log', 'error.log', 'access.log'];
  const logDir = path.join(__dirname, '../data/log');
  
  logFiles.forEach(file => {
    const filePath = path.join(logDir, file);
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
      
      console.log(`${file}: ${sizeInMB}MB`);
      
      if (stats.size > 50 * 1024 * 1024) { // 50MB警告
        console.warn(`WARNING: ${file} is getting large (${sizeInMB}MB)`);
      }
    }
  });
};

// 定期监控
setInterval(monitorLogs, 60000); // 每分钟检查一次
```

## 性能考虑

### 日志级别优化
- **生产环境**: 使用 `info` 级别，避免过多debug信息
- **开发环境**: 使用 `debug` 级别，便于问题调试
- **性能测试**: 使用 `warn` 级别，减少I/O开销

### 异步日志记录
```javascript
// 异步日志记录
const asyncLogger = {
  info: (message, meta) => {
    setImmediate(() => {
      logger.info(message, meta);
    });
  },
  
  error: (message, meta) => {
    // 错误日志保持同步，确保记录
    logger.error(message, meta);
  }
};
```

### 缓冲区设置
```javascript
// 设置较大的缓冲区减少磁盘写入
const fileTransport = new winston.transports.File({
  filename: 'app.log',
  options: {
    highWaterMark: 64 * 1024  // 64KB缓冲区
  }
});
```

## 故障排查

### 常见问题

#### 日志文件过大
- 检查轮转配置是否正确
- 降低日志级别减少输出
- 增加清理频率

#### 性能影响
- 使用异步日志记录
- 减少不必要的debug日志
- 优化日志格式化过程

#### 磁盘空间不足
- 实施自动清理策略
- 压缩历史日志文件
- 监控磁盘使用情况

---

*本文档最后更新: 2025年8月*
