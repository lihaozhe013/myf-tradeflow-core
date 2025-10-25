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

  db.all(listSql, listParams, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const countSql = `SELECT COUNT(*) as total${baseWhere}`;
    db.get<CountResult>(countSql, whereParams, (countErr, countResult) => {
      if (countErr) {
        res.status(500).json({ error: countErr.message });
        return;
      }

      res.json({
        data: rows,
        pagination: {
          page: Number(page),
          limit,
          total: countResult!.total,
          pages: Math.ceil(countResult!.total / limit)
        }
      });
    });
  });
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
  
  db.get(sql, [partner_short_name, product_model, targetDate], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'No valid price found' });
      return;
    }
    
    res.json({ data: row });
  });
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
  
  db.run(sql, [partner_short_name, product_model, effective_date, unit_price], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ id: this.lastID, message: 'Product price created!' });
  });
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
  
  db.run(sql, [partner_short_name, product_model, effective_date, unit_price, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Product price dne' });
      return;
    }
    
    res.json({ message: 'Product price updated!' });
  });
});

/**
 * DELETE /api/product-prices/:id
 */
router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  
  db.run('DELETE FROM product_prices WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Product price dne' });
      return;
    }
    
    res.json({ message: 'Product price delete!' });
  });
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
  
  db.get<UnitPriceResult>(sql, [partner_short_name, product_model, date], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'No valid price found' });
      return;
    }
    
    res.json({ unit_price: row.unit_price });
  });
});

export default router;