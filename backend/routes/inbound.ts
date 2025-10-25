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

/**
 * GET /api/inbound
 */
router.get('/', (req: Request, res: Response): void => {
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

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
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
    
    db.get<CountResult>(countSql, countParams, (err, countResult) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json({
        data: rows,
        pagination: {
          page: pageNum,
          limit: limit,
          total: countResult!.total,
          pages: Math.ceil(countResult!.total / limit)
        }
      });
    });
  });
});

/**
 * POST /api/inbound
 */
router.post('/', (req: Request, res: Response): void => {
  const {
    supplier_code, supplier_short_name, supplier_full_name, 
    product_code, product_model, quantity, unit_price,
    inbound_date, invoice_date, invoice_number, invoice_image_url, order_number,
    remark
  } = req.body;

  const total_price = decimalCalc.calculateTotalPrice(quantity, unit_price);
  
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
    
    res.json({ id: this.lastID, message: 'Inbound record created!' });
  });
});

/**
 * PUT /api/inbound/:id
 */
router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const {
    supplier_code, supplier_short_name, supplier_full_name, 
    product_code, product_model, quantity, unit_price,
    inbound_date, invoice_date, invoice_number, invoice_image_url, order_number,
    remark
  } = req.body;
  
  const total_price = decimalCalc.calculateTotalPrice(quantity, unit_price);
  
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
      res.status(404).json({ error: 'No inbound records exist' });
      return;
    }
    
    res.json({ message: 'Inbound record updated!' });
  });
});

/**
 * DELETE /api/inbound/:id
 */
router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  
  db.run('DELETE FROM inbound_records WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'No inbound records exist' });
      return;
    }
    
    res.json({ message: 'Inbound record deleted!' });
  });
});

export default router;