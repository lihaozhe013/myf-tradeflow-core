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
 * GET /api/inbound
 */
router.get('/', (req: Request, res: Response): void => {
  try {
    let { page = 1 } = req.query;
    let pageNum = parseInt(page as string, 10);
    if (!Number.isFinite(pageNum) || pageNum < 1) pageNum = 1;
    const limit = 10;
    
    let sql = 'SELECT * FROM inbound_records WHERE 1=1';
    const params: any[] = [];
    
    if (isProvided(req.query['supplier_short_name'])) {
      sql += ' AND supplier_short_name LIKE ?';
      params.push(`%${req.query['supplier_short_name']}%`);
    }
    if (isProvided(req.query['product_model'])) {
      sql += ' AND product_model LIKE ?';
      params.push(`%${req.query['product_model']}%`);
    }
    if (isProvided(req.query['start_date'])) {
      sql += ' AND inbound_date >= ?';
      params.push(req.query['start_date']);
    }
    if (isProvided(req.query['end_date'])) {
      sql += ' AND inbound_date <= ?';
      params.push(req.query['end_date']);
    }

    const allowedSortFields = ['inbound_date', 'unit_price', 'total_price', 'id'];
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
    
    let countSql = 'SELECT COUNT(*) as total FROM inbound_records WHERE 1=1';
    const countParams: any[] = [];
    
    if (isProvided(req.query['supplier_short_name'])) {
      countSql += ' AND supplier_short_name LIKE ?';
      countParams.push(`%${req.query['supplier_short_name']}%`);
    }
    if (isProvided(req.query['product_model'])) {
      countSql += ' AND product_model LIKE ?';
      countParams.push(`%${req.query['product_model']}%`);
    }
    if (isProvided(req.query['start_date'])) {
      countSql += ' AND inbound_date >= ?';
      countParams.push(req.query['start_date']);
    }
    if (isProvided(req.query['end_date'])) {
      countSql += ' AND inbound_date <= ?';
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
 * POST /api/inbound
 */
router.post('/', (req: Request, res: Response): void => {
  try {
    const {
      supplier_code, supplier_short_name, supplier_full_name, 
      product_code, product_model, quantity, unit_price,
      inbound_date, invoice_date, invoice_number, receipt_number, order_number,
      remark
    } = req.body;

    const total_price = decimalCalc.calculateTotalPrice(quantity, unit_price);
    
    const sql = `
      INSERT INTO inbound_records 
      (supplier_code, supplier_short_name, supplier_full_name, 
       product_code, product_model, quantity, unit_price, total_price, 
       inbound_date, invoice_date, invoice_number, receipt_number, order_number, 
       remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      supplier_code, supplier_short_name, supplier_full_name, 
      product_code, product_model, quantity, unit_price, total_price,
      inbound_date, invoice_date, invoice_number, receipt_number, order_number,
      remark
    ];
    
    const result = db.prepare(sql).run(...params);
    
    res.json({ id: result.lastInsertRowid, message: 'Inbound record created!' });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/inbound/:id
 */
router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    
    const {
      supplier_code, supplier_short_name, supplier_full_name, 
      product_code, product_model, quantity, unit_price,
      inbound_date, invoice_date, invoice_number, receipt_number, order_number,
      remark
    } = req.body;
    
    const total_price = decimalCalc.calculateTotalPrice(quantity, unit_price);
    
    const sql = `
      UPDATE inbound_records SET
      supplier_code=?, supplier_short_name=?, supplier_full_name=?, 
      product_code=?, product_model=?, quantity=?, unit_price=?, total_price=?,
      inbound_date=?, invoice_date=?, invoice_number=?, receipt_number=?, order_number=?,
      remark=?
      WHERE id=?
    `;
    
    const params = [
      supplier_code, supplier_short_name, supplier_full_name, 
      product_code, product_model, quantity, unit_price, total_price,
      inbound_date, invoice_date, invoice_number, receipt_number, order_number,
      remark, id
    ];
    
    const result = db.prepare(sql).run(...params);
    
    if (result.changes === 0) {
      res.status(404).json({ error: 'No inbound records exist' });
      return;
    }
    
    res.json({ message: 'Inbound record updated!' });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/inbound/:id
 */
router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    
    const result = db.prepare('DELETE FROM inbound_records WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      res.status(404).json({ error: 'No inbound records exist' });
      return;
    }
    
    res.json({ message: 'Inbound record deleted!' });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/inbound/batch
 * Batch update multiple inbound records
 */
router.post('/batch', (req: Request, res: Response): void => {
  try {
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
      'supplier_code', 'supplier_short_name', 'supplier_full_name',
      'product_code', 'product_model', 'quantity', 'unit_price',
      'inbound_date', 'invoice_date', 'invoice_number', 'receipt_number', 
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
    let completed = 0;
    let errors = 0;
    const notFound: number[] = [];
    
    const batchUpdate = db.transaction(() => {
      for (const recordId of ids) {
        try {
          // If we need to recalculate total_price, we need to fetch current values first
          if (needsRecalculation) {
            const row = db.prepare('SELECT quantity, unit_price FROM inbound_records WHERE id = ?').get(recordId) as any;
            
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
            
            const sql = `UPDATE inbound_records SET ${finalUpdateFields.join(', ')} WHERE id=?`;
            
            const result = db.prepare(sql).run(...finalUpdateValues);
            if (result.changes === 0) {
              notFound.push(recordId);
            } else {
              completed++;
            }
          } else {
            // No recalculation needed, direct update
            const finalUpdateValues = [...updateValues, recordId];
            const sql = `UPDATE inbound_records SET ${updateFields.join(', ')} WHERE id=?`;
            
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