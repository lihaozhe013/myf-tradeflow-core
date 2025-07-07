const express = require('express');
const router = express.Router();
const db = require('../db');
const { updateStock } = require('../utils/stockService');

// 获取入库记录列表
router.get('/', (req, res) => {
  const { page = 1, limit = 10, supplier_short_name, product_model, start_date, end_date, sort_field, sort_order } = req.query;
  
  let sql = 'SELECT * FROM inbound_records WHERE 1=1';
  let params = [];
  
  // 添加过滤条件
  if (supplier_short_name) {
    sql += ' AND supplier_short_name LIKE ?';
    params.push(`%${supplier_short_name}%`);
  }
  if (product_model) {
    sql += ' AND product_model LIKE ?';
    params.push(`%${product_model}%`);
  }
  if (start_date) {
    sql += ' AND inbound_date >= ?';
    params.push(start_date);
  }
  if (end_date) {
    sql += ' AND inbound_date <= ?';
    params.push(end_date);
  }

  // 排序
  const allowedSortFields = ['inbound_date', 'unit_price', 'total_price', 'id'];
  let orderBy = 'id DESC';
  if (sort_field && allowedSortFields.includes(sort_field)) {
    orderBy = `${sort_field} ${sort_order && sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC'}`;
  }
  sql += ` ORDER BY ${orderBy}`;

  // 分页
  const offset = (page - 1) * limit;
  sql += ' LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    // 获取总数
    let countSql = 'SELECT COUNT(*) as total FROM inbound_records WHERE 1=1';
    let countParams = [];
    if (supplier_short_name) {
      countSql += ' AND supplier_short_name LIKE ?';
      countParams.push(`%${supplier_short_name}%`);
    }
    if (product_model) {
      countSql += ' AND product_model LIKE ?';
      countParams.push(`%${product_model}%`);
    }
    if (start_date) {
      countSql += ' AND inbound_date >= ?';
      countParams.push(start_date);
    }
    if (end_date) {
      countSql += ' AND inbound_date <= ?';
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

// 新增入库记录
router.post('/', (req, res) => {
  const {
    supplier_code, supplier_short_name, supplier_full_name, 
    product_code, product_model, quantity, unit_price,
    inbound_date, invoice_date, invoice_number, invoice_image_url, order_number,
    payment_date, payment_amount, payment_method, remark
  } = req.body;
  
  // 计算总价和应付金额
  const total_price = quantity * unit_price;
  const payable_amount = total_price - (payment_amount || 0);
  
  const sql = `
    INSERT INTO inbound_records 
    (supplier_code, supplier_short_name, supplier_full_name, 
     product_code, product_model, quantity, unit_price, total_price, 
     inbound_date, invoice_date, invoice_number, invoice_image_url, order_number, 
     payment_date, payment_amount, payable_amount, payment_method, remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    supplier_code, supplier_short_name, supplier_full_name, 
    product_code, product_model, quantity, unit_price, total_price,
    inbound_date, invoice_date, invoice_number, invoice_image_url, order_number,
    payment_date, payment_amount, payable_amount, payment_method, remark
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
    payment_date, payment_amount, payment_method, remark
  } = req.body;
  
  const total_price = quantity * unit_price;
  const payable_amount = total_price - (payment_amount || 0);
  
  const sql = `
    UPDATE inbound_records SET
    supplier_code=?, supplier_short_name=?, supplier_full_name=?, 
    product_code=?, product_model=?, quantity=?, unit_price=?, total_price=?,
    inbound_date=?, invoice_date=?, invoice_number=?, invoice_image_url=?, order_number=?,
    payment_date=?, payment_amount=?, payable_amount=?, payment_method=?, remark=?
    WHERE id=?
  `;
  
  const params = [
    supplier_code, supplier_short_name, supplier_full_name, 
    product_code, product_model, quantity, unit_price, total_price,
    inbound_date, invoice_date, invoice_number, invoice_image_url, order_number,
    payment_date, payment_amount, payable_amount, payment_method, remark, id
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