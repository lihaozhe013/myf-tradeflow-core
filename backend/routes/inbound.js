const express = require('express');
const router = express.Router();
const db = require('../db');
const { updateStock } = require('../utils/stockService');
const { logger } = require('../utils/logger');

// 获取入库记录列表
router.get('/', (req, res) => {
  let { page = 1 } = req.query;
  const limit = 10; // 固定每页10条
  
  let sql = 'SELECT * FROM inbound_records WHERE 1=1';
  let params = [];
  
  // 添加过滤条件
  if (req.query.supplier_short_name) {
    sql += ' AND supplier_short_name LIKE ?';
    params.push(`%${req.query.supplier_short_name}%`);
  }
  if (req.query.product_model) {
    sql += ' AND product_model LIKE ?';
    params.push(`%${req.query.product_model}%`);
  }
  if (req.query.start_date) {
    sql += ' AND inbound_date >= ?';
    params.push(req.query.start_date);
  }
  if (req.query.end_date) {
    sql += ' AND inbound_date <= ?';
    params.push(req.query.end_date);
  }

  // 排序
  const allowedSortFields = ['inbound_date', 'unit_price', 'total_price', 'id'];
  let orderBy = 'id DESC';
  if (req.query.sort_field && allowedSortFields.includes(req.query.sort_field)) {
    orderBy = `${req.query.sort_field} ${req.query.sort_order && req.query.sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC'}`;
  }
  sql += ` ORDER BY ${orderBy}`;

  // 分页
  const offset = (page - 1) * limit;
  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, parseInt(offset));

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM inbound_records WHERE 1=1';
    let countParams = [];
    if (req.query.supplier_short_name) {
      countSql += ' AND supplier_short_name LIKE ?';
      countParams.push(`%${req.query.supplier_short_name}%`);
    }
    if (req.query.product_model) {
      countSql += ' AND product_model LIKE ?';
      countParams.push(`%${req.query.product_model}%`);
    }
    if (req.query.start_date) {
      countSql += ' AND inbound_date >= ?';
      countParams.push(req.query.start_date);
    }
    if (req.query.end_date) {
      countSql += ' AND inbound_date <= ?';
      countParams.push(req.query.end_date);
    }
    db.get(countSql, countParams, (err, countResult) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: limit,
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

// 新增入库记录
router.post('/', (req, res) => {
  const {
    supplier_code, supplier_short_name, supplier_full_name, 
    product_code, product_model, quantity, unit_price,
    inbound_date, invoice_date, invoice_number, invoice_image_url, order_number,
    remark
  } = req.body;
  
  // 计算总价并处理浮点数精度问题
  const total_price = Math.round((quantity * unit_price) * 100) / 100;
  
  const sql = `
    INSERT INTO inbound_records 
    (supplier_code, supplier_short_name, supplier_full_name, 
     product_code, product_model, quantity, unit_price, total_price, 
     inbound_date, invoice_date, invoice_number, invoice_image_url, order_number, 
     remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    supplier_code, supplier_short_name, supplier_full_name, 
    product_code, product_model, quantity, unit_price, total_price,
    inbound_date, invoice_date, invoice_number, invoice_image_url, order_number,
    remark
  ];
  
  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 更新库存
    updateStock(this.lastID, product_model, quantity, 'inbound');
    
    res.json({ id: this.lastID, message: '入库记录创建成功' });
  });
});

// 修改入库记录
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    supplier_code, supplier_short_name, supplier_full_name, 
    product_code, product_model, quantity, unit_price,
    inbound_date, invoice_date, invoice_number, invoice_image_url, order_number,
    remark
  } = req.body;
  
  // 计算总价并处理浮点数精度问题
  const total_price = Math.round((quantity * unit_price) * 100) / 100;
  
  const sql = `
    UPDATE inbound_records SET
    supplier_code=?, supplier_short_name=?, supplier_full_name=?, 
    product_code=?, product_model=?, quantity=?, unit_price=?, total_price=?,
    inbound_date=?, invoice_date=?, invoice_number=?, invoice_image_url=?, order_number=?,
    remark=?
    WHERE id=?
  `;
  
  const params = [
    supplier_code, supplier_short_name, supplier_full_name, 
    product_code, product_model, quantity, unit_price, total_price,
    inbound_date, invoice_date, invoice_number, invoice_image_url, order_number,
    remark, id
  ];
  
  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: '入库记录不存在' });
      return;
    }
    
    res.json({ message: '入库记录更新成功' });
  });
});

// 删除入库记录
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM inbound_records WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: '入库记录不存在' });
      return;
    }
    
    res.json({ message: '入库记录删除成功' });
  });
});

module.exports = router;