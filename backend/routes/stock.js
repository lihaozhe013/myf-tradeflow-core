const express = require('express');
const router = express.Router();
const { getStockSummary, refreshStockCache } = require('../utils/stockCacheService');

// 获取库存明细
router.get('/', (req, res) => {
  const { product_model, page = 1, limit = 10 } = req.query;
  
  getStockSummary(product_model, page, limit, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json(result);
  });
});

// 刷新库存缓存
router.post('/refresh', (req, res) => {
  refreshStockCache((err, stockData) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ 
      success: true, 
      message: '库存缓存刷新成功',
      last_updated: stockData.last_updated,
      products_count: Object.keys(stockData.products).length
    });
  });
});

module.exports = router; 