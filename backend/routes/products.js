const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取产品列表
router.get('/', (req, res) => {
  const { category, product_model, short_name } = req.query;
  
  let sql = 'SELECT * FROM products WHERE 1=1';
  let params = [];
  
  if (category) {
    sql += ' AND category LIKE ?';
    params.push(`%${category}%`);
  }
  if (product_model) {
    sql += ' AND product_model LIKE ?';
    params.push(`%${product_model}%`);
  }
  if (short_name) {
    sql += ' AND short_name LIKE ?';
    params.push(`%${short_name}%`);
  }
  
  sql += ' ORDER BY short_name';
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ data: rows });
  });
});

// 新增产品
router.post('/', (req, res) => {
  const { short_name, category, product_model, remark } = req.body;
  
  const sql = `
    INSERT INTO products (short_name, category, product_model, remark)
    VALUES (?, ?, ?, ?)
  `;
  
  db.run(sql, [short_name, category, product_model, remark], function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        res.status(400).json({ error: '产品简称已存在' });
      } else {
        res.status(500).json({ error: err.message });
      }
      return;
    }
    
    res.json({ short_name, message: '产品创建成功' });
  });
});

// 修改产品（按short_name主键）
router.put('/:short_name', (req, res) => {
  const { short_name } = req.params;
  const { category, product_model, remark } = req.body;
  const sql = `UPDATE products SET category=?, product_model=?, remark=? WHERE short_name=?`;
  db.run(sql, [category, product_model, remark, short_name], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: '产品不存在' });
      return;
    }
    res.json({ message: '产品更新成功' });
  });
});

// 删除产品（按short_name主键）
router.delete('/:short_name', (req, res) => {
  const { short_name } = req.params;
  db.run('DELETE FROM products WHERE short_name = ?', [short_name], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: '产品不存在' });
      return;
    }
    res.json({ message: '产品删除成功' });
  });
});

module.exports = router;