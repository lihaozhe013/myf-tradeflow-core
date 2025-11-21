import express, { type Router, type Request, type Response } from 'express';
import db from '@/db.js';
import decimalCalc from '@/utils/decimalCalculator.js';

const router: Router = express.Router();

interface CountResult {
  total: number;
}

/**
 * Validate query parameters (exclude empty strings, null, and undefined)
 */
function isProvided(val: any): boolean {
  return !(val === undefined || val === null || val === '' || val === 'null' || val === 'undefined');
}

// No mapping between invoice_* and receipt_*; API uses invoice_* directly.

/**
 * GET /api/outbound
 */
router.get('/', (req: Request, res: Response): void => {
  try {
    let { page = 1 } = req.query;
    let pageNum = parseInt(page as string, 10);
    if (!Number.isFinite(pageNum) || pageNum < 1) pageNum = 1;
    const limit = 10;
    
    let sql = 'SELECT * FROM outbound_records WHERE 1=1';
    const params: any[] = [];
    
    if (isProvided(req.query['customer_short_name'])) {
      sql += ' AND customer_short_name LIKE ?';
      params.push(`%${req.query['customer_short_name']}%`);
    }
    if (isProvided(req.query['product_model'])) {
      sql += ' AND product_model LIKE ?';
      params.push(`%${req.query['product_model']}%`);
    }
    if (isProvided(req.query['start_date'])) {
      sql += ' AND outbound_date >= ?';
      params.push(req.query['start_date']);
    }
    if (isProvided(req.query['end_date'])) {
      sql += ' AND outbound_date <= ?';
      params.push(req.query['end_date']);
    }

    const allowedSortFields = ['outbound_date', 'unit_price', 'total_price', 'id'];
    let orderBy = 'id DESC';
    if (req.query['sort_field'] && allowedSortFields.includes(req.query['sort_field'] as string)) {
      const sortOrder = req.query['sort_order'] && (req.query['sort_order'] as string).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      orderBy = `${req.query['sort_field']} ${sortOrder}`;
    }
    sql += ` ORDER BY ${orderBy}`;

    const offset = (pageNum - 1) * limit;
    sql += ' LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = db.prepare(sql).all(...params);
    
    let countSql = 'SELECT COUNT(*) as total FROM outbound_records WHERE 1=1';
    const countParams: any[] = [];
    
    if (isProvided(req.query['customer_short_name'])) {
      countSql += ' AND customer_short_name LIKE ?';
      countParams.push(`%${req.query['customer_short_name']}%`);
    }
    if (isProvided(req.query['product_model'])) {
      countSql += ' AND product_model LIKE ?';
      countParams.push(`%${req.query['product_model']}%`);
    }
    if (isProvided(req.query['start_date'])) {
      countSql += ' AND outbound_date >= ?';
      countParams.push(req.query['start_date']);
    }
    if (isProvided(req.query['end_date'])) {
      countSql += ' AND outbound_date <= ?';
      countParams.push(req.query['end_date']);
    }
    
    const countResult = db.prepare(countSql).get(...countParams) as CountResult;
    
    res.json({
      data: rows,
      pagination: {
        page: pageNum,
        limit: limit,
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/outbound
 */
router.post('/', (req: Request, res: Response): void => {
  const {
    customer_code, customer_short_name, customer_full_name, 
    product_code, product_model, quantity, unit_price,
    outbound_date, invoice_date, invoice_number, receipt_number, order_number,
    remark
  } = req.body;
  
  const total_price = decimalCalc.calculateTotalPrice(quantity, unit_price);
  
  const sql = `
    INSERT INTO outbound_records 
    (customer_code, customer_short_name, customer_full_name, 
     product_code, product_model, quantity, unit_price, total_price,
     outbound_date, invoice_date, invoice_number, receipt_number, order_number,
     remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    customer_code, customer_short_name, customer_full_name, 
    product_code, product_model, quantity, unit_price, total_price,
    outbound_date, invoice_date, invoice_number, receipt_number, order_number,
    remark
  ];
  
  try {
    const result = db.prepare(sql).run(...params);
    
    res.json({ id: result.lastInsertRowid, message: 'Outbound record created!' });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/outbound/:id
 */
router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  
  const {
    customer_code, customer_short_name, customer_full_name, 
    product_code, product_model, quantity, unit_price,
    outbound_date, invoice_date, invoice_number, receipt_number, order_number,
    remark
  } = req.body;
  
  const total_price = decimalCalc.calculateTotalPrice(quantity, unit_price);
  
  const sql = `
    UPDATE outbound_records SET
    customer_code=?, customer_short_name=?, customer_full_name=?, 
    product_code=?, product_model=?, quantity=?, unit_price=?, total_price=?,
    outbound_date=?, invoice_date=?, invoice_number=?, receipt_number=?, order_number=?,
    remark=?
    WHERE id=?
  `;
  
  const params = [
    customer_code, customer_short_name, customer_full_name, 
    product_code, product_model, quantity, unit_price, total_price,
    outbound_date, invoice_date, invoice_number, receipt_number, order_number,
    remark, id
  ];
  
  try {
    const result = db.prepare(sql).run(...params);
    
    if (result.changes === 0) {
      res.status(404).json({ error: 'No outbound records exist' });
      return;
    }
    
    res.json({ message: 'Outbound record updated!' });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/outbound/:id
 */
router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    
    const result = db.prepare('DELETE FROM outbound_records WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      res.status(404).json({ error: 'No outbound records exist' });
      return;
    }
    
    res.json({ message: 'Outbound record updated!' });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/outbound/batch
 * Batch update multiple outbound records
 */
router.post('/batch', (req: Request, res: Response): void => {
  const { ids, updates } = req.body;
  
  // Validate request
  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'ids array is required and must not be empty' });
    return;
  }
  
  if (!updates || typeof updates !== 'object') {
    res.status(400).json({ error: 'updates object is required' });
    return;
  }
  
  // Build dynamic UPDATE statement based on provided fields
  const updateFields: string[] = [];
  const updateValues: any[] = [];
  
  const allowedFields = [
    'customer_code', 'customer_short_name', 'customer_full_name',
    'product_code', 'product_model', 'quantity', 'unit_price',
    'outbound_date', 'invoice_date', 'invoice_number', 'receipt_number', 
    'order_number', 'remark'
  ];
  
  // Track if we need to recalculate total_price
  let needsRecalculation = false;
  let hasQuantity = false;
  let hasUnitPrice = false;
  
  for (const field of allowedFields) {
    if (isProvided(updates[field])) {
      updateFields.push(`${field}=?`);
      updateValues.push(updates[field]);
      
      if (field === 'quantity') hasQuantity = true;
      if (field === 'unit_price') hasUnitPrice = true;
    }
  }
  
  if (updateFields.length === 0) {
    res.status(400).json({ error: 'No valid update fields provided' });
    return;
  }
  
  needsRecalculation = hasQuantity || hasUnitPrice;
  
  // Execute batch update with transaction for better performance
  try {
    let completed = 0;
    let errors = 0;
    const notFound: number[] = [];
    
    const batchUpdate = db.transaction(() => {
      for (const recordId of ids) {
        try {
          // If we need to recalculate total_price, we need to fetch current values first
          if (needsRecalculation) {
            const row = db.prepare('SELECT quantity, unit_price FROM outbound_records WHERE id = ?').get(recordId) as any;
            
            if (!row) {
              notFound.push(recordId);
              continue;
            }
            
            // Calculate new total_price
            const finalQuantity = hasQuantity ? updates.quantity : row.quantity;
            const finalUnitPrice = hasUnitPrice ? updates.unit_price : row.unit_price;
            const total_price = decimalCalc.calculateTotalPrice(finalQuantity, finalUnitPrice);
            
            // Add total_price to update
            const finalUpdateFields = [...updateFields, 'total_price=?'];
            const finalUpdateValues = [...updateValues, total_price, recordId];
            
            const sql = `UPDATE outbound_records SET ${finalUpdateFields.join(', ')} WHERE id=?`;
            
            const result = db.prepare(sql).run(...finalUpdateValues);
            if (result.changes === 0) {
              notFound.push(recordId);
            } else {
              completed++;
            }
          } else {
            // No recalculation needed, direct update
            const finalUpdateValues = [...updateValues, recordId];
            const sql = `UPDATE outbound_records SET ${updateFields.join(', ')} WHERE id=?`;
            
            const result = db.prepare(sql).run(...finalUpdateValues);
            if (result.changes === 0) {
              notFound.push(recordId);
            } else {
              completed++;
            }
          }
        } catch (err) {
          errors++;
        }
      }
    });
    
    batchUpdate();
    
    res.json({
      message: 'Batch update completed!',
      updated: completed,
      notFound: notFound,
      errors: errors
    });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

export default router;
