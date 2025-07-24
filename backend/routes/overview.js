const express = require('express');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
const path = require('path');

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
  const totalQueries = 10;
  const queries = [
    // 缺货产品明细
    {
      key: 'out_of_stock_products',
      query: `
        SELECT product_model
        FROM (
          SELECT product_model, SUM(CASE WHEN record_id < 0 THEN -stock_quantity ELSE stock_quantity END) as stock_quantity
          FROM stock
          GROUP BY product_model
        )
        WHERE stock_quantity <= 0
      `
    },
    // 总体数据统计
    {
      key: 'overview',
      query: `
        SELECT 
          (SELECT COUNT(*) FROM inbound_records) as total_inbound,
          (SELECT COUNT(*) FROM outbound_records) as total_outbound,
          (SELECT COUNT(*) FROM partners WHERE type = 0) as suppliers_count,
          (SELECT COUNT(*) FROM partners WHERE type = 1) as customers_count,
          (SELECT COUNT(*) FROM products) as products_count,
          (SELECT COUNT(DISTINCT product_model) FROM stock) as stocked_products,
          (SELECT SUM(total_price) FROM inbound_records) as total_purchase_amount,
          (SELECT SUM(total_price) FROM outbound_records) as total_sales_amount
      `
    },
    // 最近7天的入库趋势
    {
      key: 'inbound_trend',
      query: `
        SELECT 
          inbound_date as date,
          COUNT(*) as count,
          SUM(total_price) as amount
        FROM inbound_records 
        WHERE date(inbound_date) >= date('now', '-7 days')
        GROUP BY inbound_date
        ORDER BY inbound_date DESC
      `
    },
    // 最近7天的出库趋势
    {
      key: 'outbound_trend',
      query: `
        SELECT 
          outbound_date as date,
          COUNT(*) as count,
          SUM(total_price) as amount
        FROM outbound_records 
        WHERE date(outbound_date) >= date('now', '-7 days')
        GROUP BY outbound_date
        ORDER BY outbound_date DESC
      `
    },
    // 库存状态分析
    {
      key: 'stock_analysis',
      query: `
        SELECT 
          CASE 
            WHEN stock_quantity <= 0 THEN '缺货'
            WHEN stock_quantity <= 10 THEN '库存不足'
            WHEN stock_quantity <= 50 THEN '库存正常'
            ELSE '库存充足'
          END as status,
          COUNT(*) as count
        FROM (
          SELECT product_model, 
                 SUM(CASE WHEN record_id < 0 THEN -stock_quantity ELSE stock_quantity END) as stock_quantity
          FROM stock 
          GROUP BY product_model
        ) as stock_summary
        GROUP BY status
      `
    },
    // 热门产品（按出库量）
    {
      key: 'popular_products',
      query: `
        SELECT 
          product_model,
          SUM(quantity) as total_quantity,
          SUM(total_price) as total_amount,
          COUNT(*) as order_count
        FROM outbound_records
        GROUP BY product_model
        ORDER BY total_quantity DESC
        LIMIT 10
      `
    },
    // 主要客户（按销售额）
    {
      key: 'top_customers',
      query: `
        SELECT 
          customer_short_name,
          SUM(total_price) as total_amount,
          COUNT(*) as order_count
        FROM outbound_records
        GROUP BY customer_short_name
        ORDER BY total_amount DESC
        LIMIT 10
      `
    },
    // 主要供应商（按采购额）
    {
      key: 'top_suppliers',
      query: `
        SELECT 
          supplier_short_name,
          SUM(total_price) as total_amount,
          COUNT(*) as order_count
        FROM inbound_records
        GROUP BY supplier_short_name
        ORDER BY total_amount DESC
        LIMIT 10
      `
    },
    // 库存变化趋势（最近30天）
    {
      key: 'stock_trend',
      query: `
        SELECT 
          update_time as date,
          product_model,
          stock_quantity,
          (SELECT SUM(
            CASE 
              WHEN s2.record_id < 0 THEN -s2.stock_quantity 
              ELSE s2.stock_quantity 
            END
          ) FROM stock s2 WHERE s2.product_model = s.product_model AND s2.update_time <= s.update_time) as cumulative_stock
        FROM stock s
        WHERE date(update_time) >= date('now', '-30 days')
        ORDER BY update_time ASC
      `
    },
    // 月度趋势统计
    {
      key: 'monthly_trend',
      query: `
        SELECT 
          strftime('%Y-%m', inbound_date) as month,
          COUNT(*) as inbound_count,
          SUM(total_price) as inbound_amount,
          0 as outbound_count,
          0 as outbound_amount
        FROM inbound_records
        WHERE date(inbound_date) >= date('now', '-6 months')
        GROUP BY strftime('%Y-%m', inbound_date)
        
        UNION ALL
        
        SELECT 
          strftime('%Y-%m', outbound_date) as month,
          0 as inbound_count,
          0 as inbound_amount,
          COUNT(*) as outbound_count,
          SUM(total_price) as outbound_amount
        FROM outbound_records
        WHERE date(outbound_date) >= date('now', '-6 months')
        GROUP BY strftime('%Y-%m', outbound_date)
        
        ORDER BY month DESC
      `
    }
  ];

  // 执行所有查询
  queries.forEach(({ key, query }) => {
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error(`Error in ${key} query:`, err);
        stats[key] = { error: err.message };
      } else {
        stats[key] = rows;
      }
      completed++;
      if (completed === totalQueries) {
        // 写入缓存文件
        try {
          fs.mkdirSync(path.dirname(statsFile), { recursive: true }); // 确保 data 目录存在
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
    stock: 'SELECT * FROM stock ORDER BY update_time DESC',
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

// 更新库存函数
function updateStock(recordId, productModel, quantity) {
  // 查询当前库存
  db.get('SELECT SUM(CASE WHEN record_id < 0 THEN -stock_quantity ELSE stock_quantity END) as current_stock FROM stock WHERE product_model = ?', [productModel], (err, row) => {
    const currentStock = (row && row.current_stock) || 0;
    const newStock = currentStock + quantity;
    
    // 插入库存记录
    const sql = 'INSERT INTO stock (record_id, product_model, stock_quantity, update_time) VALUES (?, ?, ?, ?)';
    db.run(sql, [recordId, productModel, newStock, new Date().toISOString()], (err) => {
      if (err) {
        console.error('库存更新失败:', err);
      }
    });
  });
}

// 获取指定产品的本月库存变化量
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
  
  // 查询本月库存变化数据
  const queries = {
    // 获取月初库存（月初第一天之前的累计库存）
    monthStartStock: `
      SELECT COALESCE(SUM(
        CASE 
          WHEN record_id < 0 THEN -stock_quantity 
          ELSE stock_quantity 
        END
      ), 0) as stock
      FROM stock 
      WHERE product_model = ? AND date(update_time) < ?
    `,
    
    // 获取当前库存
    currentStock: `
      SELECT COALESCE(SUM(
        CASE 
          WHEN record_id < 0 THEN -stock_quantity 
          ELSE stock_quantity 
        END
      ), 0) as stock
      FROM stock 
      WHERE product_model = ?
    `,
    
    // 获取本月入库统计
    monthlyInbound: `
      SELECT 
        COUNT(*) as inbound_count,
        COALESCE(SUM(quantity), 0) as total_inbound
      FROM inbound_records 
      WHERE product_model = ? AND date(inbound_date) >= ?
    `,
    
    // 获取本月出库统计
    monthlyOutbound: `
      SELECT 
        COUNT(*) as outbound_count,
        COALESCE(SUM(quantity), 0) as total_outbound
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
    let params;
    if (key === 'monthStartStock') {
      params = [productModel, monthStartStr];
    } else if (key === 'currentStock') {
      params = [productModel];
    } else {
      params = [productModel, monthStartStr];
    }

    db.get(queries[key], params, (err, row) => {
      if (err) {
        console.error(`查询${key}失败:`, err);
        hasError = true;
      } else {
        if (key === 'monthStartStock') {
          results.month_start_stock = row.stock || 0;
        } else if (key === 'currentStock') {
          results.current_stock = row.stock || 0;
        } else if (key === 'monthlyInbound') {
          results.inbound_count = row.inbound_count || 0;
          results.total_inbound = row.total_inbound || 0;
        } else if (key === 'monthlyOutbound') {
          results.outbound_count = row.outbound_count || 0;
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
          // 计算库存变化量
          const monthStartStock = results.month_start_stock || 0;
          const currentStock = results.current_stock || 0;
          results.stock_change = currentStock - monthStartStock;

          res.json({
            success: true,
            data: results,
            message: '获取库存变化数据成功'
          });
        }
      }
    });
  });
});

module.exports = router;