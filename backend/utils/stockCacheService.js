const db = require('../db');
const fs = require('fs');
const path = require('path');
const { logger } = require('./logger');

const STOCK_CACHE_FILE = path.resolve(__dirname, '../../data/stock-summary.json');

// 从入库/出库记录计算每个产品的当前库存
function calculateStockFromRecords(callback) {
  const stockMap = {};
  let completed = 0;
  const totalQueries = 2;

  // 处理入库记录
  db.all('SELECT product_model, SUM(quantity) as total_inbound FROM inbound_records GROUP BY product_model', [], (err, inboundRows) => {
    if (err) return callback(err);
    
    inboundRows.forEach(row => {
      if (!stockMap[row.product_model]) {
        stockMap[row.product_model] = { inbound: 0, outbound: 0 };
      }
      stockMap[row.product_model].inbound = row.total_inbound || 0;
    });
    
    completed++;
    if (completed === totalQueries) {
      processStockData();
    }
  });

  // 处理出库记录
  db.all('SELECT product_model, SUM(quantity) as total_outbound FROM outbound_records GROUP BY product_model', [], (err, outboundRows) => {
    if (err) return callback(err);
    
    outboundRows.forEach(row => {
      if (!stockMap[row.product_model]) {
        stockMap[row.product_model] = { inbound: 0, outbound: 0 };
      }
      stockMap[row.product_model].outbound = row.total_outbound || 0;
    });
    
    completed++;
    if (completed === totalQueries) {
      processStockData();
    }
  });

  function processStockData() {
    // 获取最后入库和出库日期
    let productQueries = 0;
    const productList = Object.keys(stockMap);
    
    if (productList.length === 0) {
      // 没有库存数据
      return callback(null, {
        last_updated: new Date().toISOString(),
        products: {}
      });
    }

    productList.forEach(productModel => {
      let productCompleted = 0;
      const productData = {
        current_stock: stockMap[productModel].inbound - stockMap[productModel].outbound,
        last_inbound: null,
        last_outbound: null
      };

      // 获取最后入库日期
      db.get('SELECT MAX(inbound_date) as last_inbound FROM inbound_records WHERE product_model = ?', [productModel], (err, row) => {
        if (!err && row) {
          productData.last_inbound = row.last_inbound;
        }
        productCompleted++;
        if (productCompleted === 2) {
          stockMap[productModel] = productData;
          productQueries++;
          if (productQueries === productList.length) {
            callback(null, {
              last_updated: new Date().toISOString(),
              products: stockMap
            });
          }
        }
      });

      // 获取最后出库日期
      db.get('SELECT MAX(outbound_date) as last_outbound FROM outbound_records WHERE product_model = ?', [productModel], (err, row) => {
        if (!err && row) {
          productData.last_outbound = row.last_outbound;
        }
        productCompleted++;
        if (productCompleted === 2) {
          stockMap[productModel] = productData;
          productQueries++;
          if (productQueries === productList.length) {
            callback(null, {
              last_updated: new Date().toISOString(),
              products: stockMap
            });
          }
        }
      });
    });
  }
}

// 刷新库存缓存
function refreshStockCache(callback) {
  calculateStockFromRecords((err, stockData) => {
    if (err) return callback(err);
    
    try {
      // 确保data目录存在
      const dataDir = path.dirname(STOCK_CACHE_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // 写入缓存文件
      fs.writeFileSync(STOCK_CACHE_FILE, JSON.stringify(stockData, null, 2));
      callback(null, stockData);
    } catch (writeErr) {
      callback(writeErr);
    }
  });
}

// 读取库存缓存
function getStockCache(callback) {
  try {
    if (!fs.existsSync(STOCK_CACHE_FILE)) {
      logger.warn('库存缓存不存在，尝试刷新缓存');
      return refreshStockCache((refreshErr) => {
        if (refreshErr) {
          logger.error('刷新库存缓存失败', { error: refreshErr.message });
          return callback(new Error('库存缓存不存在且刷新失败，请检查系统设置'));
        }
        getStockCache(callback); // 递归调用以获取刷新后的缓存
      });
    }

    const data = fs.readFileSync(STOCK_CACHE_FILE, 'utf8');
    const stockData = JSON.parse(data);
    callback(null, stockData);
  } catch (err) {
    logger.error('读取库存缓存失败', { error: err.message });
    callback(err);
  }
}

// 获取库存明细（支持分页和筛选）
function getStockSummary(productModel, page = 1, limit = 10, callback) {
  getStockCache((err, stockData) => {
    if (err) return callback(err);
    
    let products = Object.entries(stockData.products);
    
    // 筛选产品
    if (productModel) {
      products = products.filter(([model]) => 
        model.toLowerCase().includes(productModel.toLowerCase())
      );
    }
    
    // 分页
    const total = products.length;
    const offset = (page - 1) * limit;
    const pagedProducts = products.slice(offset, offset + limit);
    
    // 转换格式
    const result = pagedProducts.map(([product_model, data]) => ({
      product_model,
      current_stock: data.current_stock,
      last_inbound: data.last_inbound,
      last_outbound: data.last_outbound,
      last_update: stockData.last_updated
    }));
    
    callback(null, {
      data: result,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  });
}

// 获取库存总数
function getStockSummaryCount(productModel, callback) {
  getStockCache((err, stockData) => {
    if (err) return callback(err);
    
    let products = Object.keys(stockData.products);
    
    if (productModel) {
      products = products.filter(model => 
        model.toLowerCase().includes(productModel.toLowerCase())
      );
    }
    
    callback(null, { total: products.length });
  });
}

// 获取所有产品的库存数据（用于overview统计）
function getAllStockData(callback) {
  getStockCache((err, stockData) => {
    if (err) {
      logger.error('获取库存数据失败', { error: err.message });
      return callback(err);
    }
    callback(null, stockData.products);
  });
}

module.exports = {
  refreshStockCache,
  getStockCache,
  getStockSummary,
  getStockSummaryCount,
  getAllStockData
};
