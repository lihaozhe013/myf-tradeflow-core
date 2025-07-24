const express = require('express');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
const path = require('path');
const { getAllStockData } = require('../utils/stockCacheService');

// 获取系统统计数据
// GET 只读缓存
router.get('/stats', (req, res) => {
  const statsFile = path.resolve(__dirname, '../../data/overview-stats.json');
  if (fs.existsSync(statsFile)) {
    try {
      const json = fs.readFileSync(statsFile, 'utf-8');
      return res.json(JSON.parse(json));
    } catch (e) {
      // 读取失败则继续重新计算
    }
  }
  // 缓存不存在或读取失败，返回空或错误
  return res.status(503).json({ error: '统计数据未生成，请先刷新。' });
});

// POST 强制刷新并写入缓存
router.post('/stats', (req, res) => {
  const statsFile = path.resolve(__dirname, '../../data/overview-stats.json');
  const stats = {};
  let completed = 0;
  const totalQueries = 2;
  const queries = [
    {
      key: 'out_of_stock_products',
      customHandler: (callback) => {
        getAllStockData((err, stockData) => {
          if (err) return callback(err);
          const outOfStockProducts = Object.entries(stockData)
            .filter(([, data]) => data.current_stock <= 0)
            .map(([product_model]) => ({ product_model }));
          callback(null, outOfStockProducts);
        });
      }
    },
    {
      key: 'overview',
      customHandler: (callback) => {
        db.get(`
          SELECT 
            (SELECT COUNT(*) FROM inbound_records) as total_inbound,
            (SELECT COUNT(*) FROM outbound_records) as total_outbound,
            (SELECT COUNT(*) FROM partners WHERE type = 0) as suppliers_count,
            (SELECT COUNT(*) FROM partners WHERE type = 1) as customers_count,
            (SELECT COUNT(*) FROM products) as products_count,
            (SELECT SUM(total_price) FROM inbound_records) as total_purchase_amount,
            (SELECT SUM(total_price) FROM outbound_records) as total_sales_amount
        `, [], (err, row) => {
          if (err) return callback(err);
          getAllStockData((stockErr, stockData) => {
            if (stockErr) return callback(stockErr);
            const result = {
              ...row,
              stocked_products: Object.keys(stockData).length
            };
            callback(null, result);
          });
        });
      }
    }
  ];

  queries.forEach(({ key, customHandler }) => {
    customHandler((err, result) => {
      if (err) {
        console.error(`Error in ${key} customHandler:`, err);
        stats[key] = { error: err.message };
      } else {
        stats[key] = result;
      }
      completed++;
      if (completed === totalQueries) {
        try {
          fs.mkdirSync(path.dirname(statsFile), { recursive: true });
          fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2), 'utf-8');
        } catch (e) {
          console.error('写入 overview-stats.json 失败:', e);
        }
        res.json(stats);
      }
    });
  });
});

// 调试接口：获取所有表的数据（保留原有功能）
router.get('/all-tables', (req, res) => {
  const queries = {
    inbound_records: 'SELECT * FROM inbound_records ORDER BY id DESC',
    outbound_records: 'SELECT * FROM outbound_records ORDER BY id DESC',
    partners: 'SELECT * FROM partners ORDER BY short_name',
    product_prices: 'SELECT * FROM product_prices ORDER BY effective_date DESC'
  };

  const results = {};
  const tableNames = Object.keys(queries);
  let completed = 0;

  tableNames.forEach(tableName => {
    db.all(queries[tableName], [], (err, rows) => {
      if (err) {
        console.error(`Error querying ${tableName}:`, err);
        results[tableName] = { error: err.message };
      } else {
        results[tableName] = rows;
      }
      
      completed++;
      if (completed === tableNames.length) {
        res.json(results);
      }
    });
  });
});

// 获取指定产品的本月库存变化量（简化版本，移除额外统计）
router.get('/monthly-stock-change/:productModel', (req, res) => {
  const productModel = req.params.productModel;
  
  if (!productModel) {
    return res.status(400).json({
      success: false,
      message: '产品型号不能为空'
    });
  }

  // 获取本月第一天的日期
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthStartStr = monthStart.toISOString().split('T')[0];
  
  // 简化查询，只计算基本库存变化
  const queries = {
    // 获取月初前的累计入库
    beforeMonthInbound: `
      SELECT COALESCE(SUM(quantity), 0) as total
      FROM inbound_records 
      WHERE product_model = ? AND date(inbound_date) < ?
    `,
    
    // 获取月初前的累计出库
    beforeMonthOutbound: `
      SELECT COALESCE(SUM(quantity), 0) as total
      FROM outbound_records 
      WHERE product_model = ? AND date(outbound_date) < ?
    `,
    
    // 获取本月入库总量
    monthlyInbound: `
      SELECT COALESCE(SUM(quantity), 0) as total_inbound
      FROM inbound_records 
      WHERE product_model = ? AND date(inbound_date) >= ?
    `,
    
    // 获取本月出库总量
    monthlyOutbound: `
      SELECT COALESCE(SUM(quantity), 0) as total_outbound
      FROM outbound_records 
      WHERE product_model = ? AND date(outbound_date) >= ?
    `
  };

  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;
  let hasError = false;

  // 执行所有查询
  Object.keys(queries).forEach(key => {
    const params = [productModel, monthStartStr];

    db.get(queries[key], params, (err, row) => {
      if (err) {
        console.error(`查询${key}失败:`, err);
        hasError = true;
      } else {
        if (key === 'beforeMonthInbound') {
          results.before_month_inbound = row.total || 0;
        } else if (key === 'beforeMonthOutbound') {
          results.before_month_outbound = row.total || 0;
        } else if (key === 'monthlyInbound') {
          results.total_inbound = row.total_inbound || 0;
        } else if (key === 'monthlyOutbound') {
          results.total_outbound = row.total_outbound || 0;
        }
      }

      completed++;
      if (completed === totalQueries) {
        if (hasError) {
          res.status(500).json({
            success: false,
            message: '查询库存数据时发生错误'
          });
        } else {
          // 计算月初库存和当前库存
          const monthStartStock = results.before_month_inbound - results.before_month_outbound;
          const currentStock = monthStartStock + results.total_inbound - results.total_outbound;
          const monthlyChange = results.total_inbound - results.total_outbound;

          res.json({
            success: true,
            data: {
              product_model: productModel,
              month_start_stock: monthStartStock,
              current_stock: currentStock,
              monthly_change: monthlyChange,
              query_date: new Date().toISOString()
            }
          });
        }
      }
    });
  });
});

module.exports = router;