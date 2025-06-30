const express = require('express');
const router = express.Router();
const { getStockSummary, getStockHistory } = require('../utils/stockService');

// 获取库存明细
router.get('/', (req, res) => {
  const { product_model } = req.query;
  
  getStockSummary(product_model, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ data: rows });
  });
});

// 获取库存历史记录
router.get('/history', (req, res) => {
  const { product_model, page = 1, limit = 20 } = req.query;
  
  getStockHistory(product_model, page, limit, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ data: rows });
  });
});

module.exports = router; 