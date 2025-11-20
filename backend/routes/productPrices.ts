import express, { type Router, type Request, type Response } from 'express';
import db from '@/db.js';

const router: Router = express.Router();

interface CountResult {
  total: number;
}

interface UnitPriceResult {
  unit_price: number;
}

router.get('/', (req: Request, res: Response): void => {
  const { partner_short_name, product_model, effective_date } = req.query;
  let { page = 1 } = req.query;
  const limit = 10;

  let baseWhere = ' FROM product_prices WHERE 1=1';
  const whereParams: any[] = [];

  if (partner_short_name) {
    baseWhere += ' AND partner_short_name LIKE ?';
    whereParams.push(`%${partner_short_name}%`);
  }
  if (product_model) {
    baseWhere += ' AND product_model LIKE ?';
    whereParams.push(`%${product_model}%`);
  }
  if (effective_date) {
    baseWhere += ' AND effective_date = ?';
    whereParams.push(effective_date);
  }

  const orderBy = ' ORDER BY effective_date DESC, partner_short_name, product_model';

  const offset = (Number(page) - 1) * limit;
  const listSql = `SELECT *${baseWhere}${orderBy} LIMIT ? OFFSET ?`;
  const listParams = [...whereParams, limit, offset];

  try {
    const rows = db.prepare(listSql).all(...listParams);

    const countSql = `SELECT COUNT(*) as total${baseWhere}`;
    const countResult = db.prepare(countSql).get(...whereParams) as CountResult;

    res.json({
      data: rows,
      pagination: {
        page: Number(page),
        limit,
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
 * GET /api/product-prices/current
 */
router.get('/current', (req: Request, res: Response): void => {
  const { partner_short_name, product_model, date } = req.query;
  
  if (!partner_short_name || !product_model) {
    res.status(400).json({ error: 'Missing required argument: partner_short_name & product_model' });
    return;
  }
  
  const targetDate = (date as string) || new Date().toISOString().split('T')[0];
  
  const sql = `
    SELECT * FROM product_prices 
    WHERE partner_short_name = ? AND product_model = ? AND effective_date <= ?
    ORDER BY effective_date DESC 
    LIMIT 1
  `;
  
  try {
    const row = db.prepare(sql).get(partner_short_name, product_model, targetDate);
    
    if (!row) {
      res.status(404).json({ error: 'No valid price found' });
      return;
    }
    
    res.json({ data: row });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/product-prices
 */
router.post('/', (req: Request, res: Response): void => {
  const { partner_short_name, product_model, effective_date, unit_price } = req.body;
  
  const sql = `
    INSERT INTO product_prices (partner_short_name, product_model, effective_date, unit_price)
    VALUES (?, ?, ?, ?)
  `;
  
  try {
    const result = db.prepare(sql).run(partner_short_name, product_model, effective_date, unit_price);
    
    res.json({ id: result.lastInsertRowid, message: 'Product price created!' });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/product-prices/:id
 */
router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const { partner_short_name, product_model, effective_date, unit_price } = req.body;
  
  const sql = `
    UPDATE product_prices SET partner_short_name=?, product_model=?, effective_date=?, unit_price=?
    WHERE id=?
  `;
  
  try {
    const result = db.prepare(sql).run(partner_short_name, product_model, effective_date, unit_price, id);
    
    if (result.changes === 0) {
      res.status(404).json({ error: 'Product price dne' });
      return;
    }
    
    res.json({ message: 'Product price updated!' });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/product-prices/:id
 */
router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    
    const result = db.prepare('DELETE FROM product_prices WHERE id = ?').run(id);
    
    if (result.changes === 0) {
      res.status(404).json({ error: 'Product price dne' });
      return;
    }
    
    res.json({ message: 'Product price delete!' });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/product-prices/auto
 * Automatically get product prices
 * (exact match and effective date <= specified date, take the latest one)
 */
router.get('/auto', (req: Request, res: Response): void => {
  const { partner_short_name, product_model, date } = req.query;
  
  if (!partner_short_name || !product_model || !date) {
    res.status(400).json({ error: 'Missing required argument: partner_short_name, product_model, date' });
    return;
  }
  
  const sql = `
    SELECT unit_price FROM product_prices
    WHERE partner_short_name = ? AND product_model = ? AND effective_date <= ?
    ORDER BY effective_date DESC
    LIMIT 1
  `;
  
  try {
    const row = db.prepare(sql).get(partner_short_name, product_model, date) as UnitPriceResult;
    
    if (!row) {
      res.status(404).json({ error: 'No valid price found' });
      return;
    }
    
    res.json({ unit_price: row.unit_price });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

export default router;