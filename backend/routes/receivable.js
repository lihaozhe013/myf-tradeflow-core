const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取应收账款列表（实时计算）
router.get('/', (req, res) => {
  const { page = 1, limit = 10, customer_short_name, sort_field = 'balance', sort_order = 'desc' } = req.query;
  
  let whereSql = '';
  let params = [];
  
  if (customer_short_name) {
    whereSql = ' AND p.short_name LIKE ?';
    params.push(`%${customer_short_name}%`);
  }

  // 排序
  const allowedSortFields = ['customer_code', 'customer_short_name', 'total_receivable', 'total_paid', 'balance', 'last_payment_date'];
  let orderBy = 'balance DESC';
  if (sort_field && allowedSortFields.includes(sort_field)) {
    orderBy = `${sort_field} ${sort_order && sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC'}`;
  }

  const offset = (page - 1) * limit;
  
  const sql = `
    SELECT 
      p.code AS customer_code,
      p.short_name AS customer_short_name,
      p.full_name AS customer_full_name,
      COALESCE(SUM(o.total_price), 0) AS total_receivable,
      COALESCE(SUM(r.amount), 0) AS total_paid,
      MAX(r.pay_date) AS last_payment_date,
      MAX(r.pay_method) AS last_payment_method,
      COALESCE(SUM(o.total_price), 0) - COALESCE(SUM(r.amount), 0) AS balance,
      COUNT(DISTINCT r.id) AS payment_count
    FROM partners p
    LEFT JOIN outbound_records o ON p.code = o.customer_code
    LEFT JOIN receivable_payments r ON p.code = r.customer_code
    WHERE p.type = 1${whereSql}
    GROUP BY p.code, p.short_name, p.full_name
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;
  
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // 获取总数
    const countSql = `
      SELECT COUNT(DISTINCT p.code) as total
      FROM partners p
      WHERE p.type = 1${whereSql}
    `;
    
    const countParams = customer_short_name ? [`%${customer_short_name}%`] : [];
    
    db.get(countSql, countParams, (err, countResult) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({
        data: rows,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    });
  });
});

// 新增回款记录
router.post('/payments', (req, res) => {
  const { customer_code, amount, pay_date, pay_method, remark } = req.body;
  
  if (!customer_code || !amount || !pay_date) {
    return res.status(400).json({ error: '客户代号、回款金额和回款日期为必填项' });
  }
  
  const sql = `
    INSERT INTO receivable_payments (customer_code, amount, pay_date, pay_method, remark)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [customer_code, amount, pay_date, pay_method || '', remark || ''], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: '回款记录创建成功' });
  });
});

// 修改回款记录
router.put('/payments/:id', (req, res) => {
  const { id } = req.params;
  const { customer_code, amount, pay_date, pay_method, remark } = req.body;
  
  if (!customer_code || !amount || !pay_date) {
    return res.status(400).json({ error: '客户代号、回款金额和回款日期为必填项' });
  }
  
  const sql = `
    UPDATE receivable_payments 
    SET customer_code=?, amount=?, pay_date=?, pay_method=?, remark=?
    WHERE id=?
  `;
  
  db.run(sql, [customer_code, amount, pay_date, pay_method || '', remark || '', id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: '回款记录不存在' });
      return;
    }
    res.json({ message: '回款记录更新成功' });
  });
});

// 删除回款记录
router.delete('/payments/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM receivable_payments WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: '回款记录不存在' });
      return;
    }
    
    res.json({ message: '回款记录删除成功' });
  });
});

// 获取客户的应收账款详情（包含出库记录和回款记录）
router.get('/details/:customer_code', (req, res) => {
  const { customer_code } = req.params;
  
  // 获取客户信息
  const customerSql = 'SELECT * FROM partners WHERE code = ? AND type = 1';
  
  db.get(customerSql, [customer_code], (err, customer) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!customer) {
      res.status(404).json({ error: '客户不存在' });
      return;
    }
    
    // 获取出库记录
    const outboundSql = 'SELECT * FROM outbound_records WHERE customer_code = ? ORDER BY outbound_date DESC';
    
    db.all(outboundSql, [customer_code], (err, outboundRecords) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // 获取回款记录
      const paymentSql = 'SELECT * FROM receivable_payments WHERE customer_code = ? ORDER BY pay_date DESC';
      
      db.all(paymentSql, [customer_code], (err, paymentRecords) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        // 计算统计数据
        const totalReceivable = outboundRecords.reduce((sum, record) => sum + (record.total_price || 0), 0);
        const totalPaid = paymentRecords.reduce((sum, record) => sum + (record.amount || 0), 0);
        const balance = totalReceivable - totalPaid;
        
        res.json({
          customer,
          summary: {
            total_receivable: totalReceivable,
            total_paid: totalPaid,
            balance: balance
          },
          outbound_records: outboundRecords,
          payment_records: paymentRecords
        });
      });
    });
  });
});

module.exports = router;
