const express = require('express');
const router = express.Router();
const { getStockSummary, getStockSummaryCount, getStockHistory } = require('../utils/stockService');

// 获取库存明细
router.get('/', (req, res) => {
  const { product_model, page = 1, limit = 10 } = req.query;
  
  getStockSummary(product_model, page, limit, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 获取总数
    getStockSummaryCount(product_model, (countErr, countResult) => {
      if (countErr) {
        res.status(500).json({ error: countErr.message });
        return;
      }
      
      res.json({
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / parseInt(limit))
        }
      });
    });
  });
});

// 获取库存历史记录
router.get('/history', (req, res) => {
  const { product_model, page = 1, limit = 10 } = req.query;
  
  getStockHistory(product_model, page, limit, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 获取库存历史总数
    let countSql = 'SELECT COUNT(*) as total FROM stock WHERE 1=1';
    let countParams = [];
    
    if (product_model) {
      countSql += ' AND product_model LIKE ?';
      countParams.push(`%${product_model}%`);
    }
    
    const db = require('../db');
    db.get(countSql, countParams, (countErr, countResult) => {
      if (countErr) {
        res.status(500).json({ error: countErr.message });
        return;
      }
      
      res.json({
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / parseInt(limit))
        }
      });
    });
  });
});

module.exports = router; 