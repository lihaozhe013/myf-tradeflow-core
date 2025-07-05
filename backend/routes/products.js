const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取产品列表
router.get('/', (req, res) => {
  const { category, product_model, short_name, code } = req.query;
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
  if (code) {
    sql += ' AND code LIKE ?';
    params.push(`%${code}%`);
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
  const { code, short_name, category, product_model, remark } = req.body;
  const sql = `
    INSERT INTO products (code, short_name, category, product_model, remark)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.run(sql, [code, short_name, category, product_model, remark], function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        res.status(400).json({ error: '产品代号或简称已存在' });
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
  const { code, category, product_model, remark } = req.body;
  const sql = `UPDATE products SET code=?, category=?, product_model=?, remark=? WHERE short_name=?`;
  db.run(sql, [code, category, product_model, remark, short_name], function(err) {
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

// 批量/单条设置代号-简称-型号强绑定
router.post('/bindings', (req, res) => {
  const bindings = Array.isArray(req.body) ? req.body : [req.body];
  // bindings: [{code, short_name, product_model}]
  if (!bindings.length) return res.status(400).json({ error: '无绑定数据' });
  const codes = new Set();
  const shorts = new Set();
  const models = new Set();
  for (const b of bindings) {
    if (!b.code || !b.short_name || !b.product_model) {
      return res.status(400).json({ error: '三项均不能为空' });
    }
    if (codes.has(b.code) || shorts.has(b.short_name) || models.has(b.product_model)) {
      return res.status(400).json({ error: '批量数据内有重复' });
    }
    codes.add(b.code); shorts.add(b.short_name); models.add(b.product_model);
  }
  // 检查数据库冲突
  const placeholders = bindings.map(() => '?').join(',');
  const checkSql = `SELECT code, short_name, product_model FROM products WHERE code IN (${placeholders}) OR short_name IN (${placeholders}) OR product_model IN (${placeholders})`;
  const params = [...bindings.map(b=>b.code), ...bindings.map(b=>b.short_name), ...bindings.map(b=>b.product_model)];
  db.all(checkSql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows && rows.length) {
      return res.status(400).json({ error: '与现有数据冲突', conflicts: rows });
    }
    // 插入/更新
    const stmt = db.prepare('INSERT OR REPLACE INTO products (code, short_name, product_model) VALUES (?, ?, ?)');
    for (const b of bindings) {
      stmt.run([b.code, b.short_name, b.product_model]);
    }
    stmt.finalize((err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({ message: '绑定成功' });
    });
  });
});

module.exports = router;