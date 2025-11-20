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
  
  try {
    const rows = db.prepare(sql).all(...params);
    res.json({ data: rows });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
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
  
  try {
    db.prepare(sql).run(code, short_name, full_name, address, contact_person, contact_phone, type);
    res.json({ short_name, message: 'Customer/Supplier created!' });
  } catch (err) {
    const error = err as Error;
    if ((error as any).code === 'SQLITE_CONSTRAINT') {
      res.status(400).json({ error: 'The customer/supplier code or abbreviation already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
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
  
  try {
    const result = db.prepare(sql).run(code, full_name, address, contact_person, contact_phone, type, short_name);
    
    if (result.changes === 0) {
      res.status(404).json({ error: 'Customer/Supplier does not exist' });
      return;
    }
    
    res.json({ message: 'Customer/Supplier updated!' });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/partners/:short_name
 */
router.delete('/:short_name', (req: Request, res: Response): void => {
  try {
    const { short_name } = req.params;
    
    const result = db.prepare('DELETE FROM partners WHERE short_name = ?').run(short_name);
    
    if (result.changes === 0) {
      res.status(404).json({ error: 'Customer/Supplier does not exist' });
      return;
    }
    
    res.json({ message: 'Customer/Supplier deleted!' });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
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

  try {
    const rows = db.prepare(checkSql).all(...params) as ConflictResult[];
    
    if (rows && rows.length) {
      res.status(400).json({ error: 'Conflicts with existing data', conflicts: rows });
      return;
    }
    
    // Insert / Update with transaction
    const stmt = db.prepare('INSERT OR REPLACE INTO partners (code, short_name, full_name) VALUES (?, ?, ?)');
    const batchInsert = db.transaction(() => {
      for (const b of bindings) {
        stmt.run(b.code, b.short_name, b.full_name);
      }
    });
    batchInsert();
    
    res.json({ message: 'Binded' });
  } catch (err) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

export default router;