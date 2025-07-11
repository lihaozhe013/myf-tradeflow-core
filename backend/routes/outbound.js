const express = require('express');
const router = express.Router();
const db = require('../db');
const { updateStock } = require('../utils/stockService');

// 获取出库记录列表
router.get('/', (req, res) => {
  let { page = 1 } = req.query;
  const limit = 10; // 固定每页10条
  
  let sql = 'SELECT * FROM outbound_records WHERE 1=1';
  let params = [];
  
  if (req.query.customer_short_name) {
    sql += ' AND customer_short_name LIKE ?';
    params.push(`%${req.query.customer_short_name}%`);
  }
  if (req.query.product_model) {
    sql += ' AND product_model LIKE ?';
    params.push(`%${req.query.product_model}%`);
  }
  if (req.query.start_date) {
    sql += ' AND outbound_date >= ?';
    params.push(req.query.start_date);
  }
  if (req.query.end_date) {
    sql += ' AND outbound_date <= ?';
    params.push(req.query.end_date);
  }

  // 排序
  const allowedSortFields = ['outbound_date', 'unit_price', 'total_price', 'id'];
  let orderBy = 'id DESC';
  if (req.query.sort_field && allowedSortFields.includes(req.query.sort_field)) {
    orderBy = `${req.query.sort_field} ${req.query.sort_order && req.query.sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC'}`;
  }
  sql += ` ORDER BY ${orderBy}`;

  const offset = (page - 1) * limit;
  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, parseInt(offset));

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    let countSql = 'SELECT COUNT(*) as total FROM outbound_records WHERE 1=1';
    let countParams = [];
    if (req.query.customer_short_name) {
      countSql += ' AND customer_short_name LIKE ?';
      countParams.push(`%${req.query.customer_short_name}%`);
    }
    if (req.query.product_model) {
      countSql += ' AND product_model LIKE ?';
      countParams.push(`%${req.query.product_model}%`);
    }
    if (req.query.start_date) {
      countSql += ' AND outbound_date >= ?';
      countParams.push(req.query.start_date);
    }
    if (req.query.end_date) {
      countSql += ' AND outbound_date <= ?';
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

// 新增出库记录
router.post('/', (req, res) => {
  const {
    customer_code, customer_short_name, customer_full_name, 
    product_code, product_model, quantity, unit_price,
    outbound_date, invoice_date, invoice_number, invoice_image_url, order_number,
    remark
  } = req.body;
  
  // 计算总价并处理浮点数精度问题
  const total_price = Math.round((quantity * unit_price) * 100) / 100;
  
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
  
  // 计算总价并处理浮点数精度问题
  const total_price = Math.round((quantity * unit_price) * 100) / 100;
  
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