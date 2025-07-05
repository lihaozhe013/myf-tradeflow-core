// 产品类型相关API
const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取所有产品类型
router.get('/', (req, res) => {
  db.all('SELECT name FROM product_categories ORDER BY name', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ data: rows.map(r => r.name) });
  });
});

// 新增产品类型（仅后端维护，前端不暴露）
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: '产品类型名称不能为空' });
    return;
  }
  db.run('INSERT INTO product_categories (name) VALUES (?)', [name.trim()], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: '产品类型添加成功', id: this.lastID });
  });
});

// 删除产品类型（仅后端维护，前端不暴露）
router.delete('/:name', (req, res) => {
  const { name } = req.params;
  db.run('DELETE FROM product_categories WHERE name = ?', [name], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: '产品类型删除成功' });
  });
});

module.exports = router;
