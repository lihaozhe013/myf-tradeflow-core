const express = require('express');
const router = express.Router();
const db = require('../db');
const { updateStock } = require('../utils/stockService');

// 获取出库记录列表
router.get('/', (req, res) => {
  const { page = 1, limit = 10, customer_short_name, product_model, start_date, end_date, sort_field, sort_order } = req.query;
  
  let sql = 'SELECT * FROM outbound_records WHERE 1=1';
  let params = [];
  
  if (customer_short_name) {
    sql += ' AND customer_short_name LIKE ?';
    params.push(`%${customer_short_name}%`);
  }
  if (product_model) {
    sql += ' AND product_model LIKE ?';
    params.push(`%${product_model}%`);
  }
  if (start_date) {
    sql += ' AND outbound_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND outbound_date <= ?';
    params.push(end_date);
  }

  // 排序
  const allowedSortFields = ['outbound_date', 'unit_price', 'total_price', 'id'];
  let orderBy = 'id DESC';
  if (sort_field && allowedSortFields.includes(sort_field)) {
    orderBy = `${sort_field} ${sort_order && sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC'}`;
  }
  sql += ` ORDER BY ${orderBy}`;

  const offset = (page - 1) * limit;
  sql += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    let countSql = 'SELECT COUNT(*) as total FROM outbound_records WHERE 1=1';
    let countParams = [];
    if (customer_short_name) {
      countSql += ' AND customer_short_name LIKE ?';
      countParams.push(`%${customer_short_name}%`);
    }
    if (product_model) {
      countSql += ' AND product_model LIKE ?';
      countParams.push(`%${product_model}%`);
    }
    if (start_date) {
      countSql += ' AND outbound_date >= ?';
      countParams.push(start_date);
    }
    if (end_date) {
      countSql += ' AND outbound_date <= ?';
      countParams.push(end_date);
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
          limit: parseInt(limit),
          total: countResult.total,
          pages: Math.ceil(countResult.total / limit)
        }
      });
    });
  });
});

// 新增出库记录
router.post('/', (req, res) => {
  const {
    customer_code, customer_short_name, customer_full_name, 
    product_code, product_model, quantity, unit_price,
    outbound_date, invoice_date, invoice_number, invoice_image_url, order_number,
    remark
  } = req.body;
  
  const total_price = quantity * unit_price;
  
  const sql = `
    INSERT INTO outbound_records 
    (customer_code, customer_short_name, customer_full_name, 
     product_code, product_model, quantity, unit_price, total_price,
     outbound_date, invoice_date, invoice_number, invoice_image_url, order_number,
     remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    customer_code, customer_short_name, customer_full_name, 
    product_code, product_model, quantity, unit_price, total_price,
    outbound_date, invoice_date, invoice_number, invoice_image_url, order_number,
    remark
  ];
  
  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 更新库存
    updateStock(this.lastID, product_model, -quantity, 'outbound');
    
    res.json({ id: this.lastID, message: '出库记录创建成功' });
  });
});

// 修改出库记录
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const {
    customer_code, customer_short_name, customer_full_name, 
    product_code, product_model, quantity, unit_price,
    outbound_date, invoice_date, invoice_number, invoice_image_url, order_number,
    remark
  } = req.body;
  
  const total_price = quantity * unit_price;
  
  const sql = `
    UPDATE outbound_records SET
    customer_code=?, customer_short_name=?, customer_full_name=?, 
    product_code=?, product_model=?, quantity=?, unit_price=?, total_price=?,
    outbound_date=?, invoice_date=?, invoice_number=?, invoice_image_url=?, order_number=?,
    remark=?
    WHERE id=?
  `;
  
  const params = [
    customer_code, customer_short_name, customer_full_name, 
    product_code, product_model, quantity, unit_price, total_price,
    outbound_date, invoice_date, invoice_number, invoice_image_url, order_number,
    remark, id
  ];
  
  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: '出库记录不存在' });
      return;
    }
    
    res.json({ message: '出库记录更新成功' });
  });
});

// 删除出库记录
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM outbound_records WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: '出库记录不存在' });
      return;
    }
    
    res.json({ message: '出库记录删除成功' });
  });
});

module.exports = router;