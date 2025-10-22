/**
 * 应付账款路由
 * 管理供应商应付账款和付款记录
 */
import express, { type Router, type Request, type Response } from 'express';
import db from '@/db.js';
import decimalCalc from '@/utils/decimalCalculator.js';

const router: Router = express.Router();

/**
 * 数据库查询结果类型
 */
interface CountResult {
  total: number;
}

interface PayableRow {
  supplier_code: string;
  supplier_short_name: string;
  supplier_full_name: string;
  total_payable: number;
  total_paid: number;
  balance: number;
  last_payment_date: string | null;
  last_payment_method: string | null;
  payment_count: number;
}

interface SupplierResult {
  code: string;
  short_name: string;
  full_name: string;
  type: number;
  address?: string;
  contact_person?: string;
  contact_phone?: string;
}

interface TotalResult {
  total: number | null;
}

/**
 * GET /api/payable
 * 获取应付账款列表（实时计算）
 */
router.get('/', (req: Request, res: Response): void => {
  const { page = 1, limit = 10, supplier_short_name, sort_field = 'balance', sort_order = 'desc' } = req.query;
  
  let whereSql = '';
  const params: any[] = [];
  
  if (supplier_short_name) {
    whereSql = ' AND p.short_name LIKE ?';
    params.push(`%${supplier_short_name}%`);
  }

  // 排序
  const allowedSortFields = ['supplier_code', 'supplier_short_name', 'total_payable', 'total_paid', 'balance', 'last_payment_date'];
  let orderBy = 'balance DESC';
  if (sort_field && allowedSortFields.includes(sort_field as string)) {
    const sortOrderStr = sort_order && (sort_order as string).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    orderBy = `${sort_field} ${sortOrderStr}`;
  }

  const offset = (Number(page) - 1) * Number(limit);

  // 修正聚合方式，避免金额重复累加
  const sql = `
    SELECT
      p.code AS supplier_code,
      p.short_name AS supplier_short_name,
      p.full_name AS supplier_full_name,
      COALESCE(i.total_payable, 0) AS total_payable,
      COALESCE(pp.total_paid, 0) AS total_paid,
      COALESCE(i.total_payable, 0) - COALESCE(pp.total_paid, 0) AS balance,
      pp.last_payment_date,
      pp.last_payment_method,
      pp.payment_count
    FROM partners p
    LEFT JOIN (
      SELECT supplier_code, SUM(total_price) AS total_payable
      FROM inbound_records
      GROUP BY supplier_code
    ) i ON p.code = i.supplier_code
    LEFT JOIN (
      SELECT supplier_code, SUM(amount) AS total_paid, MAX(pay_date) AS last_payment_date, MAX(pay_method) AS last_payment_method, COUNT(*) AS payment_count
      FROM payable_payments
      GROUP BY supplier_code
    ) pp ON p.code = pp.supplier_code
    WHERE p.type = 0${whereSql}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;

  params.push(Number(limit), offset);

  db.all<PayableRow>(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // 使用 decimal.js 重新计算精确的余额
    const processedRows = rows.map(row => {
      const totalPayable = decimalCalc.fromSqlResult(row.total_payable, 0);
      const totalPaid = decimalCalc.fromSqlResult(row.total_paid, 0);
      const balance = decimalCalc.calculateBalance(totalPayable, totalPaid);
      
      return {
        ...row,
        total_payable: totalPayable,
        total_paid: totalPaid,
        balance: balance
      };
    });

    // 获取总数
    const countSql = `
      SELECT COUNT(DISTINCT p.code) as total
      FROM partners p
      WHERE p.type = 0${whereSql}
    `;
    
    const countParams = supplier_short_name ? [`%${supplier_short_name}%`] : [];
    
    db.get<CountResult>(countSql, countParams, (err, countResult) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({
        data: processedRows,
        total: countResult!.total,
        page: Number(page),
        limit: Number(limit)
      });
    });
  });
});

/**
 * GET /api/payable/payments/:supplier_code
 * 获取指定供应商的付款记录（支持分页）
 */
router.get('/payments/:supplier_code', (req: Request, res: Response): void => {
  const { supplier_code } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  const offset = (Number(page) - 1) * Number(limit);
  
  const sql = 'SELECT * FROM payable_payments WHERE supplier_code = ? ORDER BY pay_date DESC LIMIT ? OFFSET ?';
  
  db.all(sql, [supplier_code, Number(limit), offset], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    // 获取总数
    const countSql = 'SELECT COUNT(*) as total FROM payable_payments WHERE supplier_code = ?';
    db.get<CountResult>(countSql, [supplier_code], (err, countResult) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({
        data: rows,
        total: countResult!.total,
        page: Number(page),
        limit: Number(limit)
      });
    });
  });
});

/**
 * POST /api/payable/payments
 * 新增付款记录
 */
router.post('/payments', (req: Request, res: Response): Response | void => {
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

/**
 * PUT /api/payable/payments/:id
 * 修改付款记录
 */
router.put('/payments/:id', (req: Request, res: Response): Response | void => {
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

/**
 * DELETE /api/payable/payments/:id
 * 删除付款记录
 */
router.delete('/payments/:id', (req: Request, res: Response): void => {
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

/**
 * GET /api/payable/details/:supplier_code
 * 获取供应商的应付账款详情（优化版本，入库和付款记录支持分页）
 */
router.get('/details/:supplier_code', (req: Request, res: Response): void => {
  const { supplier_code } = req.params;
  const { 
    inbound_page = 1, 
    inbound_limit = 10, 
    payment_page = 1, 
    payment_limit = 10 
  } = req.query;

  // 获取供应商信息
  const supplierSql = 'SELECT * FROM partners WHERE code = ? AND type = 0';

  db.get<SupplierResult>(supplierSql, [supplier_code], (err, supplier) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    if (!supplier) {
      res.status(404).json({ error: '供应商不存在' });
      return;
    }

    // 获取入库记录（分页）
    const inboundOffset = (Number(inbound_page) - 1) * Number(inbound_limit);
    const inboundSql = 'SELECT * FROM inbound_records WHERE supplier_code = ? ORDER BY inbound_date DESC LIMIT ? OFFSET ?';
    
    db.all(inboundSql, [supplier_code, Number(inbound_limit), inboundOffset], (err, inboundRecords) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      // 获取入库记录总数
      const inboundCountSql = 'SELECT COUNT(*) as total FROM inbound_records WHERE supplier_code = ?';
      db.get<CountResult>(inboundCountSql, [supplier_code], (err, inboundCountResult) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        // 获取付款记录（分页）
        const paymentOffset = (Number(payment_page) - 1) * Number(payment_limit);
        const paymentSql = 'SELECT * FROM payable_payments WHERE supplier_code = ? ORDER BY pay_date DESC LIMIT ? OFFSET ?';
        
        db.all(paymentSql, [supplier_code, Number(payment_limit), paymentOffset], (err, paymentRecords) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }

          // 获取付款记录总数
          const paymentCountSql = 'SELECT COUNT(*) as total FROM payable_payments WHERE supplier_code = ?';
          db.get<CountResult>(paymentCountSql, [supplier_code], (err, paymentCountResult) => {
            if (err) {
              res.status(500).json({ error: err.message });
              return;
            }

            // 计算统计数据（全量统计）
            const totalPayableSql = 'SELECT SUM(total_price) as total FROM inbound_records WHERE supplier_code = ?';
            db.get<TotalResult>(totalPayableSql, [supplier_code], (err, totalPayableResult) => {
              if (err) {
                res.status(500).json({ error: err.message });
                return;
              }
              const totalPayable = decimalCalc.fromSqlResult(totalPayableResult!.total, 0);
              const totalPaidSql = 'SELECT SUM(amount) as total FROM payable_payments WHERE supplier_code = ?';
              db.get<TotalResult>(totalPaidSql, [supplier_code], (err, totalPaidResult) => {
                if (err) {
                  res.status(500).json({ error: err.message });
                  return;
                }
                const totalPaid = decimalCalc.fromSqlResult(totalPaidResult!.total, 0);
                const balance = decimalCalc.calculateBalance(totalPayable, totalPaid);
                
                res.json({
                  supplier,
                  summary: {
                    total_payable: totalPayable,
                    total_paid: totalPaid,
                    balance: balance
                  },
                  inbound_records: {
                    data: inboundRecords,
                    total: inboundCountResult!.total,
                    page: Number(inbound_page),
                    limit: Number(inbound_limit)
                  },
                  payment_records: {
                    data: paymentRecords,
                    total: paymentCountResult!.total,
                    page: Number(payment_page),
                    limit: Number(payment_limit)
                  }
                });
              });
            });
          });
        });
      });
    });
  });
});

export default router;
