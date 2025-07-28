const express = require('express');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
const path = require('path');
const { getAllStockData } = require('../utils/stockCacheService');

/**
 * 计算已售商品的真实成本（FIFO先进先出原则）
 * @param {Function} callback 回调函数 (err, totalCost)
 */
function calculateSoldGoodsCost(callback) {
  // 1. 获取所有出库记录，按日期排序
  db.all(`
    SELECT product_model, quantity, outbound_date, unit_price as selling_price
    FROM outbound_records 
    ORDER BY date(outbound_date) ASC, id ASC
  `, [], (err, outboundRecords) => {
    if (err) return callback(err);
    
    if (outboundRecords.length === 0) {
      return callback(null, 0);
    }

    // 2. 获取所有入库记录，按日期排序（FIFO）
    db.all(`
      SELECT product_model, quantity, unit_price, inbound_date
      FROM inbound_records 
      ORDER BY date(inbound_date) ASC, id ASC
    `, [], (err, inboundRecords) => {
      if (err) return callback(err);

      // 3. 按产品分组计算成本
      const productInboundMap = {};
      inboundRecords.forEach(record => {
        if (!productInboundMap[record.product_model]) {
          productInboundMap[record.product_model] = [];
        }
        productInboundMap[record.product_model].push({
          quantity: record.quantity,
          unit_price: record.unit_price,
          inbound_date: record.inbound_date
        });
      });

      let totalSoldGoodsCost = 0;

      // 4. 为每个出库记录分配入库成本（FIFO原则）
      outboundRecords.forEach(outRecord => {
        const productModel = outRecord.product_model;
        const soldQuantity = outRecord.quantity;
        
        if (!productInboundMap[productModel]) {
          // 如果没有对应的入库记录，使用出库价格作为成本（保守估计）
          totalSoldGoodsCost += soldQuantity * (outRecord.selling_price || 0);
          return;
        }

        let remainingQuantity = soldQuantity;
        let productCost = 0;

        // FIFO：从最早的入库记录开始分配成本
        for (let i = 0; i < productInboundMap[productModel].length && remainingQuantity > 0; i++) {
          const inRecord = productInboundMap[productModel][i];
          
          if (inRecord.quantity <= 0) continue; // 已经用完的入库记录

          const availableQuantity = Math.min(inRecord.quantity, remainingQuantity);
          productCost += availableQuantity * (inRecord.unit_price || 0);
          
          // 更新剩余数量
          inRecord.quantity -= availableQuantity;
          remainingQuantity -= availableQuantity;
        }

        // 如果入库数量不足以覆盖出库数量，剩余部分使用出库价格作为成本
        if (remainingQuantity > 0) {
          productCost += remainingQuantity * (outRecord.selling_price || 0);
        }

        totalSoldGoodsCost += productCost;
      });

      callback(null, Math.round(totalSoldGoodsCost * 100) / 100); // 保留两位小数
    });
  });
}

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

// POST 强制刷新并写入缓存（含top_sales_products和monthly_stock_changes）
router.post('/stats', (req, res) => {
  const statsFile = path.resolve(__dirname, '../../data/overview-stats.json');
  const stats = {};
  let completed = 0;
  const totalQueries = 4; // 增加到4个查询
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
        // 获取基础统计数据
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
          
          // 计算已售商品的真实成本
          calculateSoldGoodsCost((costErr, soldGoodsCost) => {
            if (costErr) return callback(costErr);
            
            getAllStockData((stockErr, stockData) => {
              if (stockErr) return callback(stockErr);
              const result = {
                ...row,
                sold_goods_cost: soldGoodsCost, // 新增：已售商品成本
                stocked_products: Object.keys(stockData).length
              };
              callback(null, result);
            });
          });
        });
      }
    },
    {
      key: 'top_sales_products',
      customHandler: (callback) => {
        // 查询所有商品销售额，按降序排列
        const sql = `
          SELECT product_model, SUM(total_price) as total_sales
          FROM outbound_records
          GROUP BY product_model
          ORDER BY total_sales DESC
        `;
        const dbLimit = 100;
        db.all(sql + ` LIMIT ${dbLimit}`, [], (err, rows) => {
          if (err) return callback(err);
          const topN = 10;
          const top = rows.slice(0, topN);
          const others = rows.slice(topN);
          const otherTotal = others.reduce((sum, r) => sum + (r.total_sales || 0), 0);
          const result = top.map(r => ({ product_model: r.product_model, total_sales: r.total_sales }));
          if (otherTotal > 0) {
            result.push({ product_model: '其他', total_sales: otherTotal });
          }
          callback(null, result);
        });
      }
    },
    {
      key: 'monthly_stock_changes',
      customHandler: (callback) => {
        // 获取本月第一天的日期
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthStartStr = monthStart.toISOString().split('T')[0];
        
        // 获取所有产品型号
        db.all('SELECT DISTINCT product_model FROM products', [], (err, products) => {
          if (err) return callback(err);
          
          if (products.length === 0) {
            return callback(null, {});
          }
          
          const monthlyChanges = {};
          let productCompleted = 0;
          
          products.forEach(({ product_model }) => {
            const queries = {
              beforeMonthInbound: `
                SELECT COALESCE(SUM(quantity), 0) as total
                FROM inbound_records 
                WHERE product_model = ? AND date(inbound_date) < ?
              `,
              beforeMonthOutbound: `
                SELECT COALESCE(SUM(quantity), 0) as total
                FROM outbound_records 
                WHERE product_model = ? AND date(outbound_date) < ?
              `,
              monthlyInbound: `
                SELECT COALESCE(SUM(quantity), 0) as total_inbound
                FROM inbound_records 
                WHERE product_model = ? AND date(inbound_date) >= ?
              `,
              monthlyOutbound: `
                SELECT COALESCE(SUM(quantity), 0) as total_outbound
                FROM outbound_records 
                WHERE product_model = ? AND date(outbound_date) >= ?
              `
            };
            
            const results = {};
            let queryCompleted = 0;
            const totalSubQueries = Object.keys(queries).length;
            
            Object.keys(queries).forEach(key => {
              const params = [product_model, monthStartStr];
              
              db.get(queries[key], params, (err, row) => {
                if (!err) {
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
                
                queryCompleted++;
                if (queryCompleted === totalSubQueries) {
                  // 计算该产品的本月库存变化
                  const monthStartStock = results.before_month_inbound - results.before_month_outbound;
                  const currentStock = monthStartStock + results.total_inbound - results.total_outbound;
                  const monthlyChange = results.total_inbound - results.total_outbound;
                  
                  monthlyChanges[product_model] = {
                    product_model,
                    month_start_stock: monthStartStock,
                    current_stock: currentStock,
                    monthly_change: monthlyChange,
                    query_date: new Date().toISOString()
                  };
                  
                  productCompleted++;
                  if (productCompleted === products.length) {
                    callback(null, monthlyChanges);
                  }
                }
              });
            });
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
// 获取销售额前10的商品及“其他”合计（从overview-stats.json读取）
router.get('/top-sales-products', (req, res) => {
  const statsFile = path.resolve(__dirname, '../../data/overview-stats.json');
  if (fs.existsSync(statsFile)) {
    try {
      const json = fs.readFileSync(statsFile, 'utf-8');
      const stats = JSON.parse(json);
      if (Array.isArray(stats.top_sales_products)) {
        return res.json({ success: true, data: stats.top_sales_products });
      }
    } catch (e) {
      // 读取失败
    }
  }
  return res.status(503).json({ error: '统计数据未生成，请先刷新。' });
});

// 获取指定产品的本月库存变化量（从overview-stats.json读取）
router.get('/monthly-stock-change/:productModel', (req, res) => {
  const productModel = req.params.productModel;
  
  if (!productModel) {
    return res.status(400).json({
      success: false,
      message: '产品型号不能为空'
    });
  }

  const statsFile = path.resolve(__dirname, '../../data/overview-stats.json');
  if (fs.existsSync(statsFile)) {
    try {
      const json = fs.readFileSync(statsFile, 'utf-8');
      const stats = JSON.parse(json);
      
      // 从缓存中查找指定产品的本月库存变化数据
      if (stats.monthly_stock_changes && stats.monthly_stock_changes[productModel]) {
        return res.json({
          success: true,
          data: stats.monthly_stock_changes[productModel]
        });
      } else {
        return res.json({
          success: false,
          message: '未找到该产品的本月库存变化数据，请先刷新统计数据'
        });
      }
    } catch (e) {
      // 读取失败
    }
  }
  
  return res.status(503).json({
    success: false,
    error: '统计数据未生成，请先刷新。'
  });
});

module.exports = router;