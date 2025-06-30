const express = require('express');
const router = express.Router();
const db = require('../db');
const { setupTestData } = require('../utils/setupTestData');

// 调试接口：设置测试数据
router.post('/setup-test-data', (req, res) => {
  try {
    setupTestData();
    res.json({ success: true, message: '测试数据设置完成' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 调试接口：获取所有表的数据
router.get('/all-tables', (req, res) => {
  const queries = {
    inbound_records: 'SELECT * FROM inbound_records ORDER BY id DESC',
    outbound_records: 'SELECT * FROM outbound_records ORDER BY id DESC',
    stock: 'SELECT * FROM stock ORDER BY update_time DESC',
    partners: 'SELECT * FROM partners ORDER BY short_name',
    products: 'SELECT * FROM products ORDER BY short_name',
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

module.exports = router; 