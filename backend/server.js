const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const db = require('./db');
const { ensureAllTablesAndColumns } = require('./utils/dbUpgrade');
const { logger } = require('./utils/logger');
const { requestLogger, errorLogger } = require('./utils/loggerMiddleware');
const { authenticateToken, getAuthConfig, checkWritePermission } = require('./utils/auth');

const app = express();

// 读取应用配置
const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/appConfig.json'), 'utf8'));

// 端口配置
const PORT = process.env.PORT || (config.server && config.server.httpPort) || 8080;

// =============================================================================
// 数据库初始化
// =============================================================================

// 启动时自动检查和升级数据库结构
try {
  ensureAllTablesAndColumns();
  logger.info('数据库初始化完成');
} catch (error) {
  logger.error('数据库初始化失败', { error: error.message, stack: error.stack });
  process.exit(1);
}

// =============================================================================
// 中间件配置
// =============================================================================

// 请求日志中间件 (在其他中间件之前)
app.use(requestLogger);

// JSON 解析中间件
app.use(express.json());

// CORS 配置 (开发模式)
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: [
      'http://localhost:5173',
      `http://localhost:${PORT}`,
      'http://127.0.0.1:5173'
    ],
    credentials: true
  }));
  console.log('开发模式：已启用 CORS 跨域支持');
  logger.info('开发模式：已启用 CORS 跨域支持');
}

// =============================================================================
// API 路由注册
// =============================================================================

// 导入认证路由（优先注册登录接口）
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// 鉴权中间件（仅对API路由生效，登录接口除外）
app.use('/api', (req, res, next) => {
  // 跳过登录相关接口
  if (req.path.startsWith('/auth/')) {
    return next();
  }
  return authenticateToken(req, res, next);
});

// 写权限检查中间件（在认证中间件之后）
app.use('/api', (req, res, next) => {
  // 跳过登录相关接口
  if (req.path.startsWith('/auth/')) {
    return next();
  }
  return checkWritePermission(req, res, next);
});

// 导入所有路由模块
const overviewRoutes = require('./routes/overview');               // 总览接口
const inboundRoutes = require('./routes/inbound');                 // 入库管理
const outboundRoutes = require('./routes/outbound');               // 出库管理
const stockRoutes = require('./routes/stock');                     // 库存管理
const partnersRoutes = require('./routes/partners');               // 客户/供应商管理
const productsRoutes = require('./routes/products');               // 产品管理
const productPricesRoutes = require('./routes/productPrices');     // 产品价格管理
const receivableRoutes = require('./routes/receivable');           // 应收账款管理
const payableRoutes = require('./routes/payable');                 // 应付账款管理
const exportRoutes = require('./routes/export/index');             // 导出功能
const analysisRoutes = require('./routes/analysis/analysis');               // 数据分析功能
const aboutRoutes = require('./routes/about');                     // 关于页面

// 注册 API 路由
app.use('/api/overview', overviewRoutes);
app.use('/api/inbound', inboundRoutes);
app.use('/api/outbound', outboundRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/partners', partnersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/product-prices', productPricesRoutes);
app.use('/api/receivable', receivableRoutes);
app.use('/api/payable', payableRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/about', aboutRoutes);

// =============================================================================
// 错误处理中间件
// =============================================================================

// 错误日志中间件 (在所有路由之后)
app.use(errorLogger);

// 全局错误处理中间件
app.use((err, req, res, next) => {
  logger.error('Unhandled Error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message
  });
});

// =============================================================================
// 静态文件托管 (基于配置)
// =============================================================================


// 前端托管配置 (只在生产模式下启用，或开发模式下明确配置)
const shouldHostFrontend = config.frontend && config.frontend.hostByBackend && 
  (process.env.NODE_ENV === 'production' || process.env.FORCE_FRONTEND_HOSTING === 'true');

if (shouldHostFrontend) {
  const frontendDist = path.resolve(__dirname, '..', config.frontend.distPath || './frontend/dist');
  
  logger.info(`启用前端托管: ${frontendDist}`);
  
  // 检查前端构建文件是否存在
  if (fs.existsSync(frontendDist)) {
    // 托管前端构建文件
    app.use(express.static(frontendDist));
    
    // SPA 路由回退 - 所有未匹配的非 API 路由返回 index.html
    if (config.frontend.fallbackToIndex) {
      app.get(/^\/(?!api).*/, (req, res) => {
        res.sendFile(path.join(frontendDist, 'index.html'));
      });
    }
    
    logger.info('前端文件托管已启用');
  } else {
    logger.warn(`前端构建目录不存在: ${frontendDist}`);
    logger.warn('请先运行 npm run build 构建前端');
  }
} else {
  logger.info('前端托管已禁用，使用独立前端服务器');
}

// =============================================================================
// 服务器启动
// =============================================================================

app.listen(PORT, () => {
  console.log('服务器启动成功！');
  if (shouldHostFrontend) {
    console.log(`集成服务: http://localhost:${PORT}`);
  } else {
    console.log(`API服务: http://localhost:${PORT}`);
  }
  
  logger.info('服务器启动成功', { 
    port: PORT, 
    environment: process.env.NODE_ENV || 'development',
    pid: process.pid,
    frontend_hosted: shouldHostFrontend
  });
  
  if (process.env.NODE_ENV === 'production') {
    console.log('📦 生产环境运行中');
    if (shouldHostFrontend) {
      console.log(`🌐 集成前端服务: http://localhost:${PORT}`);
      logger.info('生产环境运行中 - 集成前端托管', { 
        frontend_url: `http://localhost:${PORT}`,
        frontend_hosted: true
      });
    } else {
      console.log(`🌐 API服务: http://localhost:${PORT}`);
      logger.info('生产环境运行中 - 仅API服务', { 
        api_url: `http://localhost:${PORT}`,
        frontend_hosted: false
      });
    }
  } else {
    console.log('🔧 开发模式运行中');
    if (shouldHostFrontend) {
      console.log(`🌐 集成前端服务: http://localhost:${PORT}`);
      console.log('💡 提示: 开发模式建议使用 http://localhost:5173');
    } else {
      console.log('🌐 前端开发服务器: http://localhost:5173');
    }
    logger.info('开发模式运行中', { 
      frontend_url: shouldHostFrontend ? 
        `http://localhost:${PORT}` : 'http://localhost:5173'
    });
  }
});