const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取产品价格列表
router.get('/', (req, res) => {
  const { partner_short_name, product_model, effective_date } = req.query;
  
  let sql = 'SELECT * FROM product_prices WHERE 1=1';
  let params = [];
  
  if (partner_short_name) {
    sql += ' AND partner_short_name LIKE ?';
    params.push(`%${partner_short_name}%`);
  }
  if (product_model) {
    sql += ' AND product_model LIKE ?';
    params.push(`%${product_model}%`);
  }
  if (effective_date) {
    sql += ' AND effective_date = ?';
    params.push(effective_date);
  }
  
  sql += ' ORDER BY effective_date DESC, partner_short_name, product_model';
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ data: rows });
  });
});

// 获取特定产品在特定日期的价格
router.get('/current', (req, res) => {
  const { partner_short_name, product_model, date } = req.query;
  
  if (!partner_short_name || !product_model) {
    res.status(400).json({ error: '缺少必要参数：partner_short_name 和 product_model' });
    return;
  }
  
  const targetDate = date || new Date().toISOString().split('T')[0];
  
  const sql = `
    SELECT * FROM product_prices 
    WHERE partner_short_name = ? AND product_model = ? AND effective_date <= ?
    ORDER BY effective_date DESC 
    LIMIT 1
  `;
  
  db.get(sql, [partner_short_name, product_model, targetDate], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: '未找到有效价格' });
      return;
    }
    
    res.json({ data: row });
  });
});

// 新增产品价格
router.post('/', (req, res) => {
  const { partner_short_name, product_model, effective_date, unit_price } = req.body;
  
  const sql = `
    INSERT INTO product_prices (partner_short_name, product_model, effective_date, unit_price)
    VALUES (?, ?, ?, ?)
  `;
  
  db.run(sql, [partner_short_name, product_model, effective_date, unit_price], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ id: this.lastID, message: '产品价格创建成功' });
  });
});

// 修改产品价格
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { partner_short_name, product_model, effective_date, unit_price } = req.body;
  
  const sql = `
    UPDATE product_prices SET partner_short_name=?, product_model=?, effective_date=?, unit_price=?
    WHERE id=?
  `;
  
  db.run(sql, [partner_short_name, product_model, effective_date, unit_price, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: '产品价格不存在' });
      return;
    }
    
    res.json({ message: '产品价格更新成功' });
  });
});

// 删除产品价格
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM product_prices WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: '产品价格不存在' });
      return;
    }
    
    res.json({ message: '产品价格删除成功' });
  });
});

// 自动获取产品价格（完全匹配且生效日期<=指定日期，取最晚的）
router.get('/auto', (req, res) => {
  const { partner_short_name, product_model, date } = req.query;
  if (!partner_short_name || !product_model || !date) {
    res.status(400).json({ error: '缺少必要参数：partner_short_name, product_model, date' });
    return;
  }
  const sql = `
    SELECT unit_price FROM product_prices
    WHERE partner_short_name = ? AND product_model = ? AND effective_date <= ?
    ORDER BY effective_date DESC
    LIMIT 1
  `;
  db.get(sql, [partner_short_name, product_model, date], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: '未找到匹配的单价' });
      return;
    }
    res.json({ unit_price: row.unit_price });
  });
});

module.exports = router;