/**
 * 小型公司进出货 + 账务系统 - 后端服务器
 * 
 * 功能模块：
 * - 数据库自动初始化和升级
 * - RESTful API 路由管理
 * - 跨域支持 (开发环境)
 * - 静态文件托管 (生产环境)
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('./db');
const { ensureAllTablesAndColumns } = require('./utils/dbUpgrade');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// 数据库初始化
// =============================================================================

console.log('🚀 启动小型进出货管理系统...');

// 启动时自动检查和升级数据库结构
ensureAllTablesAndColumns();

// =============================================================================
// 中间件配置
// =============================================================================

// JSON 解析中间件
app.use(express.json());

// CORS 跨域配置 - 仅开发环境启用
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true
  }));
  console.log('🔧 开发模式：已启用 CORS 跨域支持');
}

// =============================================================================
// API 路由注册
// =============================================================================

// 导入所有路由模块
const debugRoutes = require('./routes/debug');                     // 调试接口
const inboundRoutes = require('./routes/inbound');                 // 入库管理
const outboundRoutes = require('./routes/outbound');               // 出库管理
const stockRoutes = require('./routes/stock');                     // 库存管理
const partnersRoutes = require('./routes/partners');               // 客户/供应商管理
const productsRoutes = require('./routes/products');               // 产品管理
const productPricesRoutes = require('./routes/productPrices');     // 产品价格管理
const reportsRoutes = require('./routes/reports');                 // 报表生成
const productCategoriesRoutes = require('./routes/productCategories'); // 产品类型管理

// 注册 API 路由
app.use('/api/debug', debugRoutes);
app.use('/api/inbound', inboundRoutes);
app.use('/api/outbound', outboundRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/partners', partnersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/product-prices', productPricesRoutes);
app.use('/api/report', reportsRoutes);
app.use('/api/product-categories', productCategoriesRoutes);

console.log('✅ API 路由已注册');

// =============================================================================
// 静态文件托管 (生产环境)
// =============================================================================

if (process.env.NODE_ENV === 'production') {
  const frontendDist = path.resolve(__dirname, '../frontend/dist');
  
  // 托管前端构建文件
  app.use(express.static(frontendDist));
  
  // SPA 路由回退 - 所有未匹配的路由返回 index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  
  console.log('📦 生产模式：前端静态文件已托管');
}

// =============================================================================
// 服务器启动
// =============================================================================

// =============================================================================
// 服务器启动
// =============================================================================

app.listen(PORT, () => {
  console.log('');
  console.log('🎉 服务器启动成功！');
  console.log(`🚀 后端API服务: http://localhost:${PORT}`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log('📦 前端页面已托管在同一端口');
    console.log(`🌐 访问地址: http://localhost:${PORT}`);
  } else {
    console.log('🔧 开发模式运行中');
    console.log('🌐 前端开发服务器: http://localhost:5173');
  }
  
  console.log('');
  console.log('📚 API 接口列表:');
  console.log('   - /api/partners      - 客户/供应商管理');
  console.log('   - /api/products      - 产品管理');
  console.log('   - /api/inbound       - 入库管理');
  console.log('   - /api/outbound      - 出库管理');
  console.log('   - /api/stock         - 库存管理');
  console.log('   - /api/product-prices - 价格管理');
  console.log('   - /api/report        - 报表导出');
  console.log('   - /api/debug         - 调试接口');
  console.log('');
});