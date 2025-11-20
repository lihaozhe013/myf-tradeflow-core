import express, { type Router, type Request, type Response } from 'express';
import db from '@/db.js';
import decimalCalc from '@/utils/decimalCalculator.js';
import invoiceCacheService from '@/utils/invoiceCacheService.js';

const router: Router = express.Router();

interface CountResult {
  total: number;
}

interface ReceivableRow {
  customer_code: string;
  customer_short_name: string;
  customer_full_name: string;
  total_receivable: number;
  total_paid: number;
  balance: number;
  last_payment_date: string | null;
  last_payment_method: string | null;
  payment_count: number;
}

interface CustomerResult {
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
 * GET /api/receivable
 */
router.get('/', (req: Request, res: Response): void => {
  const { page = 1, limit = 10, customer_short_name, sort_field = 'balance', sort_order = 'desc' } = req.query;
  
  let whereSql = '';
  const params: any[] = [];
  
  if (customer_short_name) {
    whereSql = ' AND p.short_name LIKE ?';
    params.push(`%${customer_short_name}%`);
  }

  const allowedSortFields = ['customer_code', 'customer_short_name', 'total_receivable', 'total_paid', 'balance', 'last_payment_date'];
  let orderBy = 'balance DESC';
  if (sort_field && allowedSortFields.includes(sort_field as string)) {
    const sortOrderStr = sort_order && (sort_order as string).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    orderBy = `${sort_field} ${sortOrderStr}`;
  }

  const offset = (Number(page) - 1) * Number(limit);

  const sql = `
    SELECT
      p.code AS customer_code,
      p.short_name AS customer_short_name,
      p.full_name AS customer_full_name,
      COALESCE(o.total_receivable, 0) AS total_receivable,
      COALESCE(r.total_paid, 0) AS total_paid,
      COALESCE(o.total_receivable, 0) - COALESCE(r.total_paid, 0) AS balance,
      r.last_payment_date,
      r.last_payment_method,
      r.payment_count
    FROM partners p
    LEFT JOIN (
      SELECT customer_code, SUM(total_price) AS total_receivable
      FROM outbound_records
      GROUP BY customer_code
    ) o ON p.code = o.customer_code
    LEFT JOIN (
      SELECT customer_code, SUM(amount) AS total_paid, MAX(pay_date) AS last_payment_date, MAX(pay_method) AS last_payment_method, COUNT(*) AS payment_count
      from receivable_payments
      GROUP BY customer_code
    ) r ON p.code = r.customer_code
    WHERE p.type = 1${whereSql}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?
  `;
  
  params.push(Number(limit), offset);

  try {
    const rows = db.prepare(sql).all(...params) as ReceivableRow[];

    const processedRows = rows.map(row => {
      const totalReceivable = decimalCalc.fromSqlResult(row.total_receivable, 0);
      const totalPaid = decimalCalc.fromSqlResult(row.total_paid, 0);
      const balance = decimalCalc.calculateBalance(totalReceivable, totalPaid);
      
      return {
        ...row,
        total_receivable: totalReceivable,
        total_paid: totalPaid,
        balance: balance
      };
    });

    const countSql = `
      SELECT COUNT(DISTINCT p.code) as total
      FROM partners p
      WHERE p.type = 1${whereSql}
    `;
    
    const countParams = customer_short_name ? [`%${customer_short_name}%`] : [];
    const countResult = db.prepare(countSql).get(...countParams) as CountResult;
    
    res.json({
      data: processedRows,
      total: countResult.total,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/receivable/payments/:customer_code
 */
router.get('/payments/:customer_code', (req: Request, res: Response): void => {
  const { customer_code } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  const offset = (Number(page) - 1) * Number(limit);
  
  const sql = 'SELECT * FROM receivable_payments WHERE customer_code = ? ORDER BY pay_date DESC LIMIT ? OFFSET ?';
  
  try {
    const rows = db.prepare(sql).all(customer_code, Number(limit), offset);

    const countSql = 'SELECT COUNT(*) as total FROM receivable_payments WHERE customer_code = ?';
    const countResult = db.prepare(countSql).get(customer_code) as CountResult;
    
    res.json({
      data: rows,
      total: countResult.total,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/receivable/payments
 */
router.post('/payments', (req: Request, res: Response): Response | void => {
  const { customer_code, amount, pay_date, pay_method, remark } = req.body;
  
  if (!customer_code || !amount || !pay_date) {
    return res.status(400).json({ error: 'Customer ID, payment amount, and payment date are required fields' });
  }
  
  const sql = `
    INSERT INTO receivable_payments (customer_code, amount, pay_date, pay_method, remark)
    VALUES (?, ?, ?, ?, ?)
  `;
  
  try {
    const result = db.prepare(sql).run(customer_code, amount, pay_date, pay_method || '', remark || '');
    res.json({ id: result.lastInsertRowid, message: 'Payment record created!' });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/receivable/payments/:id
 */
router.put('/payments/:id', (req: Request, res: Response): Response | void => {
  const { id } = req.params;
  const { customer_code, amount, pay_date, pay_method, remark } = req.body;
  
  if (!customer_code || !amount || !pay_date) {
    return res.status(400).json({ error: 'Customer ID, payment amount, and payment date are required fields' });
  }
  
  const sql = `
    UPDATE receivable_payments 
    SET customer_code=?, amount=?, pay_date=?, pay_method=?, remark=?
    WHERE id=?
  `;
  
  try {
    const result = db.prepare(sql).run(customer_code, amount, pay_date, pay_method || '', remark || '', id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Payment records dne' });
      return;
    }
    res.json({ message: 'Payment record updated!' });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/receivable/payments/:id
 */
router.delete('/payments/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    
    const result = db.prepare('DELETE FROM receivable_payments WHERE id = ?').run(id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Payment records dne' });
      return;
    }
    
    res.json({ message: 'Payment record deleted!' });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/receivable/details/:customer_code
 */
router.get('/details/:customer_code', (req: Request, res: Response): void => {
  const { customer_code } = req.params;
  const { 
    outbound_page = 1, 
    outbound_limit = 10, 
    payment_page = 1, 
    payment_limit = 10 
  } = req.query;

  try {
    const customerSql = 'SELECT * FROM partners WHERE code = ? AND type = 1';
    const customer = db.prepare(customerSql).get(customer_code) as CustomerResult;

    if (!customer) {
      res.status(404).json({ error: 'Clienet dne' });
      return;
    }

    const outboundOffset = (Number(outbound_page) - 1) * Number(outbound_limit);
    const outboundSql = 'SELECT * FROM outbound_records WHERE customer_code = ? ORDER BY outbound_date DESC LIMIT ? OFFSET ?';
    const outboundRecords = db.prepare(outboundSql).all(customer_code, Number(outbound_limit), outboundOffset);

    const outboundCountSql = 'SELECT COUNT(*) as total FROM outbound_records WHERE customer_code = ?';
    const outboundCountResult = db.prepare(outboundCountSql).get(customer_code) as CountResult;

    const paymentOffset = (Number(payment_page) - 1) * Number(payment_limit);
    const paymentSql = 'SELECT * FROM receivable_payments WHERE customer_code = ? ORDER BY pay_date DESC LIMIT ? OFFSET ?';
    const paymentRecords = db.prepare(paymentSql).all(customer_code, Number(payment_limit), paymentOffset);

    const paymentCountSql = 'SELECT COUNT(*) as total FROM receivable_payments WHERE customer_code = ?';
    const paymentCountResult = db.prepare(paymentCountSql).get(customer_code) as CountResult;

    const totalReceivableSql = 'SELECT SUM(total_price) as total FROM outbound_records WHERE customer_code = ?';
    const totalReceivableResult = db.prepare(totalReceivableSql).get(customer_code) as TotalResult;
    const totalReceivable = decimalCalc.fromSqlResult(totalReceivableResult.total, 0);
    
    const totalPaidSql = 'SELECT SUM(amount) as total FROM receivable_payments WHERE customer_code = ?';
    const totalPaidResult = db.prepare(totalPaidSql).get(customer_code) as TotalResult;
    const totalPaid = decimalCalc.fromSqlResult(totalPaidResult.total, 0);
    const balance = decimalCalc.calculateBalance(totalReceivable, totalPaid);
    
    res.json({
      customer,
      summary: {
        total_receivable: totalReceivable,
        total_paid: totalPaid,
        balance: balance
      },
      outbound_records: {
        data: outboundRecords,
        total: outboundCountResult.total,
        page: Number(outbound_page),
        limit: Number(outbound_limit)
      },
      payment_records: {
        data: paymentRecords,
        total: paymentCountResult.total,
        page: Number(payment_page),
        limit: Number(payment_limit)
      }
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/receivable/uninvoiced/:customer_code
 * Get uninvoiced outbound records for a customer (invoice_number is NULL or empty)
 */
router.get('/uninvoiced/:customer_code', (req: Request, res: Response): void => {
  const { customer_code } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  const offset = (Number(page) - 1) * Number(limit);
  
  const sql = `
    SELECT * FROM outbound_records 
    WHERE customer_code = ? 
      AND (invoice_number IS NULL OR invoice_number = '')
    ORDER BY outbound_date DESC 
    LIMIT ? OFFSET ?
  `;
  
  try {
    const rows = db.prepare(sql).all(customer_code, Number(limit), offset);

    const countSql = `
      SELECT COUNT(*) as total FROM outbound_records 
      WHERE customer_code = ? 
        AND (invoice_number IS NULL OR invoice_number = '')
    `;
    const countResult = db.prepare(countSql).get(customer_code) as CountResult;
    
    res.json({
      data: rows,
      total: countResult.total,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/receivable/invoiced/:customer_code
 * Get invoiced records grouped by invoice_number (from cache)
 */
router.get('/invoiced/:customer_code', (req: Request, res: Response): void => {
  const customer_code  = req.params['customer_code'] as string;
  const { page = 1, limit = 10 } = req.query;
  
  const cachedRecords = invoiceCacheService.getCachedInvoicedRecords(customer_code);
  
  if (!cachedRecords) {
    res.status(404).json({ 
      error: 'No cached data found. Please refresh the cache first.',
      message: 'Cache not initialized'
    });
    return;
  }
  
  const offset = (Number(page) - 1) * Number(limit);
  const paginatedRecords = cachedRecords.slice(offset, offset + Number(limit));
  const lastUpdated = invoiceCacheService.getLastUpdateTime(customer_code);
  
  res.json({
    data: paginatedRecords,
    total: cachedRecords.length,
    page: Number(page),
    limit: Number(limit),
    last_updated: lastUpdated
  });
});

/**
 * POST /api/receivable/invoices/refresh/:customer_code
 * Refresh invoice cache for a customer
 */
router.post('/invoices/refresh/:customer_code', async (req: Request, res: Response): Promise<void> => {
  const customer_code  = req.params['customer_code'] as string;
  
  try {
    const invoicedRecords = await invoiceCacheService.refreshCustomerCache(customer_code);
    const lastUpdated = invoiceCacheService.getLastUpdateTime(customer_code);
    
    res.json({
      message: 'Invoice cache refreshed successfully',
      total: invoicedRecords.length,
      last_updated: lastUpdated,
      data: invoicedRecords
    });
  } catch (error) {
    const err = error as Error;
    res.status(500).json({ 
      error: err.message,
      message: 'Failed to refresh invoice cache'
    });
  }
});

export default router;
