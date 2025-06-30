const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取客户/供应商列表
router.get('/', (req, res) => {
  const { type, short_name, full_name } = req.query;
  
  let sql = 'SELECT * FROM partners WHERE 1=1';
  let params = [];
  
  if (type !== undefined) {
    sql += ' AND type = ?';
    params.push(parseInt(type));
  }
  if (short_name) {
    sql += ' AND short_name LIKE ?';
    params.push(`%${short_name}%`);
  }
  if (full_name) {
    sql += ' AND full_name LIKE ?';
    params.push(`%${full_name}%`);
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

// 新增客户/供应商
router.post('/', (req, res) => {
  const { short_name, full_name, address, contact_person, contact_phone, type } = req.body;
  
  const sql = `
    INSERT INTO partners (short_name, full_name, address, contact_person, contact_phone, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [short_name, full_name, address, contact_person, contact_phone, type], function(err) {
    if (err) {
      if (err.code === 'SQLITE_CONSTRAINT') {
        res.status(400).json({ error: '客户/供应商简称已存在' });
      } else {
        res.status(500).json({ error: err.message });
      }
      return;
    }
    
    res.json({ short_name, message: '客户/供应商创建成功' });
  });
});

// 修改客户/供应商
router.put('/:short_name', (req, res) => {
  const { short_name } = req.params;
  const { full_name, address, contact_person, contact_phone, type } = req.body;
  
  const sql = `
    UPDATE partners SET full_name=?, address=?, contact_person=?, contact_phone=?, type=?
    WHERE short_name=?
  `;
  
  db.run(sql, [full_name, address, contact_person, contact_phone, type, short_name], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: '客户/供应商不存在' });
      return;
    }
    
    res.json({ message: '客户/供应商更新成功' });
  });
});

// 删除客户/供应商
router.delete('/:short_name', (req, res) => {
  const { short_name } = req.params;
  
  db.run('DELETE FROM partners WHERE short_name = ?', [short_name], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: '客户/供应商不存在' });
      return;
    }
    
    res.json({ message: '客户/供应商删除成功' });
  });
});

module.exports = router; 