import express, { type Router, type Request, type Response } from 'express';
import db from '@/db.js';

const router: Router = express.Router();
interface PartnerBinding {
  code: string;
  short_name: string;
  full_name: string;
}
interface ConflictResult {
  code: string;
  short_name: string;
  full_name: string;
}

/**
 * GET /api/partners
 */
router.get('/', (req: Request, res: Response): void => {
  const { type, short_name, full_name, code } = req.query;
  
  let sql = 'SELECT * FROM partners WHERE 1=1';
  const params: any[] = [];
  
  if (type !== undefined) {
    sql += ' AND type = ?';
    params.push(parseInt(type as string));
  }
  if (short_name) {
    sql += ' AND short_name LIKE ?';
    params.push(`%${short_name}%`);
  }
  if (full_name) {
    sql += ' AND full_name LIKE ?';
    params.push(`%${full_name}%`);
  }
  if (code) {
    sql += ' AND code LIKE ?';
    params.push(`%${code}%`);
  }
  
  sql += ' ORDER BY short_name';
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ data: rows });
  });
});

/**
 * POST /api/partners
 */
router.post('/', (req: Request, res: Response): void => {
  const { code, short_name, full_name, address, contact_person, contact_phone, type } = req.body;
  
  const sql = `
    INSERT INTO partners (code, short_name, full_name, address, contact_person, contact_phone, type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [code, short_name, full_name, address, contact_person, contact_phone, type], function(err) {
    if (err) {
      if ((err as any).code === 'SQLITE_CONSTRAINT') {
        res.status(400).json({ error: 'The customer/supplier code or abbreviation already exists' });
      } else {
        res.status(500).json({ error: err.message });
      }
      return;
    }
    res.json({ short_name, message: 'Customer/Supplier created!' });
  });
});

/**
 * PUT /api/partners/:short_name
 */
router.put('/:short_name', (req: Request, res: Response): void => {
  const { short_name } = req.params;
  const { code, full_name, address, contact_person, contact_phone, type } = req.body;
  
  const sql = `
    UPDATE partners SET code=?, full_name=?, address=?, contact_person=?, contact_phone=?, type=?
    WHERE short_name=?
  `;
  
  db.run(sql, [code, full_name, address, contact_person, contact_phone, type, short_name], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Customer/Supplier does not exist' });
      return;
    }
    
    res.json({ message: 'Customer/Supplier updated!' });
  });
});

/**
 * DELETE /api/partners/:short_name
 */
router.delete('/:short_name', (req: Request, res: Response): void => {
  const { short_name } = req.params;
  
  db.run('DELETE FROM partners WHERE short_name = ?', [short_name], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'Customer/Supplier does not exist' });
      return;
    }
    
    res.json({ message: 'Customer/Supplier deleted!' });
  });
});

/**
 * POST /api/partners/bindings
 */
router.post('/bindings', (req: Request, res: Response): void => {
  const bindings: PartnerBinding[] = Array.isArray(req.body) ? req.body : [req.body];
  
  if (!bindings.length) {
    res.status(400).json({ error: 'No binding data' });
    return;
  }
  
  const codes = new Set<string>();
  const shorts = new Set<string>();
  const fulls = new Set<string>();
  
  for (const b of bindings) {
    if (!b.code || !b.short_name || !b.full_name) {
      res.status(400).json({ error: 'None of the three can be empty' });
      return;
    }
    if (codes.has(b.code) || shorts.has(b.short_name) || fulls.has(b.full_name)) {
      res.status(400).json({ error: 'Duplicated batch data' });
      return;
    }
    codes.add(b.code);
    shorts.add(b.short_name);
    fulls.add(b.full_name);
  }
  
  // check conflicts with existing data
  const placeholders = bindings.map(() => '?').join(',');
  const checkSql = `SELECT code, short_name, full_name FROM partners WHERE code IN (${placeholders}) OR short_name IN (${placeholders}) OR full_name IN (${placeholders})`;
  const params = [
    ...bindings.map(b => b.code), 
    ...bindings.map(b => b.short_name), 
    ...bindings.map(b => b.full_name)
  ];

  db.all<ConflictResult>(checkSql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (rows && rows.length) {
      res.status(400).json({ error: 'Conflicts with existing data', conflicts: rows });
      return;
    }
    
    // Insert / Update
    const stmt = db.prepare('INSERT OR REPLACE INTO partners (code, short_name, full_name) VALUES (?, ?, ?)');
    for (const b of bindings) {
      stmt.run([b.code, b.short_name, b.full_name]);
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