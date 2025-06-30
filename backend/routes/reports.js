const express = require('express');
const router = express.Router();
const { getStockReport, getInOutReport, getFinanceReport } = require('../utils/reportService');

// 库存明细报表
router.get('/stock', (req, res) => {
  getStockReport((err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ data: rows });
  });
});

// 进出货明细报表
router.get('/inout', (req, res) => {
  const { start_date, end_date, product_model } = req.query;
  
  getInOutReport(start_date, end_date, product_model, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ data: rows });
  });
});

// 收支统计报表
router.get('/finance', (req, res) => {
  const { start_date, end_date, group_by = 'month' } = req.query;
  
  getFinanceReport(start_date, end_date, group_by, (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ data: result });
  });
});

module.exports = router; 