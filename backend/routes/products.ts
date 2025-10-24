import express, { type Router, type Request, type Response } from 'express';
import db from '@/db.js';

const router: Router = express.Router();

interface ProductBinding {
  code: string;
  product_model: string;
}

interface ConflictResult {
  code: string;
  product_model: string;
}

/**
 * GET /api/products
 */
router.get('/', (req: Request, res: Response): void => {
  const { category, product_model, code } = req.query;
  
  let sql = 'SELECT * FROM products WHERE 1=1';
  const params: any[] = [];
  
  if (category) {
    sql += ' AND category LIKE ?';
    params.push(`%${category}%`);
  }
  if (product_model) {
    sql += ' AND product_model LIKE ?';
    params.push(`%${product_model}%`);
  }
  if (code) {
    sql += ' AND code LIKE ?';
    params.push(`%${code}%`);
  }
  
  sql += ' ORDER BY code';
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

/**
 * POST /api/products
 */
router.post('/', (req: Request, res: Response): void => {
  const { code, category, product_model, remark } = req.body;
  
  const sql = `
    INSERT INTO products (code, category, product_model, remark)
    VALUES (?, ?, ?, ?)
  `;
  
  db.run(sql, [code, category, product_model, remark], function(err) {
    if (err) {
      if ((err as any).code === 'SQLITE_CONSTRAINT') {
        res.status(400).json({ error: 'Product code already exists.' });
      } else {
        res.status(500).json({ error: err.message });
      }
      return;
    }
    res.json({ code, message: 'Product info created!' });
  });
});

/**
 * PUT /api/products/:code
 */
router.put('/:code', (req: Request, res: Response): void => {
  const { code } = req.params;
  const { category, product_model, remark } = req.body;
  
  const sql = `UPDATE products SET category=?, product_model=?, remark=? WHERE code=?`;
  
  db.run(sql, [category, product_model, remark, code], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Product dne' });
      return;
    }
    
    res.json({ message: 'Product info updated!' });
  });
});

/**
 * DELETE /api/products/:code
 */
router.delete('/:code', (req: Request, res: Response): void => {
  const { code } = req.params;
  
  db.run('DELETE FROM products WHERE code = ?', [code], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Product dne' });
      return;
    }
    
    res.json({ message: 'Product info deleted!' });
  });
});

/**
 * POST /api/products/bindings
 */
router.post('/bindings', (req: Request, res: Response): void => {
  const bindings: ProductBinding[] = Array.isArray(req.body) ? req.body : [req.body];
  
  if (!bindings.length) {
    res.status(400).json({ error: 'No data binded' });
    return;
  }
  
  const codes = new Set<string>();
  const models = new Set<string>();
  
  for (const b of bindings) {
    if (!b.code || !b.product_model) {
      res.status(400).json({ error: 'The code and model cannot be left blank' });
      return;
    }
    if (codes.has(b.code) || models.has(b.product_model)) {
      res.status(400).json({ error: 'Duplicated data' });
      return;
    }
    codes.add(b.code);
    models.add(b.product_model);
  }
  
  const placeholders = bindings.map(() => '?').join(',');
  const checkSql = `SELECT code, product_model FROM products WHERE code IN (${placeholders}) OR product_model IN (${placeholders})`;
  const params = [...bindings.map(b => b.code), ...bindings.map(b => b.product_model)];
  
  db.all<ConflictResult>(checkSql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (rows && rows.length) {
      res.status(400).json({ error: 'Conflict data', conflicts: rows });
      return;
    }
    
    const stmt = db.prepare('INSERT OR REPLACE INTO products (code, product_model) VALUES (?, ?)');
    for (const b of bindings) {
      stmt.run([b.code, b.product_model]);
    }
    stmt.finalize((err2) => {
      if (err2) {
        res.status(500).json({ error: err2.message });
        return;
      }
      res.json({ message: 'Binded' });
    });
  });
});

export default router;