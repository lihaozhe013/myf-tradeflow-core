const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取应付账款列表（实时计算）
router.get('/', (req, res) => {
  const { page = 1, limit = 10, supplier_short_name, sort_field = 'balance', sort_order = 'desc' } = req.query;
  
  let whereSql = '';
  let params = [];
  
  if (supplier_short_name) {
    whereSql = ' AND p.short_name LIKE ?';
    params.push(`%${supplier_short_name}%`);
  }

  // 排序
  const allowedSortFields = ['supplier_code', 'supplier_short_name', 'total_payable', 'total_paid', 'balance', 'last_payment_date'];
  let orderBy = 'balance DESC';
  if (sort_field && allowedSortFields.includes(sort_field)) {
    orderBy = `${sort_field} ${sort_order && sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC'}`;
  }

  const offset = (page - 1) * limit;
  
  const sql = `
    SELECT 
      p.code AS supplier_code,
      p.short_name AS supplier_short_name,
      p.full_name AS supplier_full_name,
      COALESCE(SUM(i.total_price), 0) AS total_payable,
      COALESCE(SUM(pp.amount), 0) AS total_paid,
      MAX(pp.pay_date) AS last_payment_date,
      MAX(pp.pay_method) AS last_payment_method,
      COALESCE(SUM(i.total_price), 0) - COALESCE(SUM(pp.amount), 0) AS balance,
      COUNT(DISTINCT pp.id) AS payment_count
    FROM partners p
    LEFT JOIN inbound_records i ON p.code = i.supplier_code
    LEFT JOIN payable_payments pp ON p.code = pp.supplier_code
    WHERE p.type = 0${whereSql}
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
      WHERE p.type = 0${whereSql}
    `;
    
    const countParams = supplier_short_name ? [`%${supplier_short_name}%`] : [];
    
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

// 获取指定供应商的付款记录
router.get('/payments/:supplier_code', (req, res) => {
  const { supplier_code } = req.params;
  const sql = 'SELECT * FROM payable_payments WHERE supplier_code = ? ORDER BY pay_date DESC';
  
  db.all(sql, [supplier_code], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

// 新增付款记录
router.post('/payments', (req, res) => {
  const { supplier_code, amount, pay_date, pay_method, remark } = req.body;
  
  if (!supplier_code || !amount || !pay_date) {
    return res.status(400).json({ error: '供应商代号、付款金额和付款日期为必填项' });
  }
  
  const sql = `
    INSERT INTO payable_payments (supplier_code, amount, pay_date, pay_method, remark)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [supplier_code, amount, pay_date, pay_method || '', remark || ''], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: '付款记录创建成功' });
  });
});

// 修改付款记录
router.put('/payments/:id', (req, res) => {
  const { id } = req.params;
  const { supplier_code, amount, pay_date, pay_method, remark } = req.body;
  
  if (!supplier_code || !amount || !pay_date) {
    return res.status(400).json({ error: '供应商代号、付款金额和付款日期为必填项' });
  }
  
  const sql = `
    UPDATE payable_payments 
    SET supplier_code=?, amount=?, pay_date=?, pay_method=?, remark=?
    WHERE id=?
  `;
  
  db.run(sql, [supplier_code, amount, pay_date, pay_method || '', remark || '', id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: '付款记录不存在' });
      return;
    }
    res.json({ message: '付款记录更新成功' });
  });
});

// 删除付款记录
router.delete('/payments/:id', (req, res) => {
  const { id } = req.params;
  
  db.run('DELETE FROM payable_payments WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: '付款记录不存在' });
      return;
    }
    
    res.json({ message: '付款记录删除成功' });
  });
});

// 获取供应商的应付账款详情（包含入库记录和付款记录）
router.get('/details/:supplier_code', (req, res) => {
  const { supplier_code } = req.params;
  
  // 获取供应商信息
  const supplierSql = 'SELECT * FROM partners WHERE code = ? AND type = 0';
  
  db.get(supplierSql, [supplier_code], (err, supplier) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!supplier) {
      res.status(404).json({ error: '供应商不存在' });
      return;
    }
    
    // 获取入库记录
    const inboundSql = 'SELECT * FROM inbound_records WHERE supplier_code = ? ORDER BY inbound_date DESC';
    
    db.all(inboundSql, [supplier_code], (err, inboundRecords) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      // 获取付款记录
      const paymentSql = 'SELECT * FROM payable_payments WHERE supplier_code = ? ORDER BY pay_date DESC';
      
      db.all(paymentSql, [supplier_code], (err, paymentRecords) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        
        // 计算统计数据
        const totalPayable = inboundRecords.reduce((sum, record) => sum + (record.total_price || 0), 0);
        const totalPaid = paymentRecords.reduce((sum, record) => sum + (record.amount || 0), 0);
        const balance = totalPayable - totalPaid;
        
        res.json({
          supplier,
          summary: {
            total_payable: totalPayable,
            total_paid: totalPaid,
            balance: balance
          },
          inbound_records: inboundRecords,
          payment_records: paymentRecords
        });
      });
    });
  });
});

module.exports = router;
