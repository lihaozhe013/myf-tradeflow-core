const { logger, accessLogger } = require('./logger');

// 请求日志中间件
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // 记录请求开始
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  };

  // 在生产环境记录访问日志
  if (process.env.NODE_ENV === 'production') {
    accessLogger.info(`${req.method} ${req.originalUrl} - ${requestInfo.ip}`);
  }

  // 监听响应结束事件
  res.on('finish', () => {
    const duration = Date.now() - start;
    const responseInfo = {
      ...requestInfo,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || 0
    };

    // 根据状态码决定日志级别
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', responseInfo);
    } else {
      logger.info('HTTP Request', responseInfo);
    }
  });

  next();
};

// 错误日志中间件
const errorLogger = (err, req, res, next) => {
  const errorInfo = {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString(),
    body: req.body,
    params: req.params,
    query: req.query
  };

  logger.error('API Error', errorInfo);
  next(err);
};

module.exports = {
  requestLogger,
  errorLogger
};
