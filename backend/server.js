const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());

// CORS配置 - 开发环境允许跨域
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
  }));
}

// 导入路由
const debugRoutes = require('./routes/debug');
const inboundRoutes = require('./routes/inbound');
const outboundRoutes = require('./routes/outbound');
const stockRoutes = require('./routes/stock');
const partnersRoutes = require('./routes/partners');
const productsRoutes = require('./routes/products');
const productPricesRoutes = require('./routes/productPrices');
const reportsRoutes = require('./routes/reports');

// 注册路由
app.use('/api/debug', debugRoutes);
app.use('/api/inbound', inboundRoutes);
app.use('/api/outbound', outboundRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/partners', partnersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/product-prices', productPricesRoutes);
app.use('/api/report', reportsRoutes);

// 生产环境托管前端静态文件
if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.resolve(__dirname, '../frontend/dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 后端API服务已启动: http://localhost:${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log('📦 前端页面已托管在同一端口');
  } else {
    console.log('🔧 开发模式: 前端请访问 http://localhost:5173');
  }
}); 