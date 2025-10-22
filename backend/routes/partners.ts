/**
 * 合作伙伴路由
 * 管理客户和供应商信息
 */
import express, { type Router, type Request, type Response } from 'express';
import db from '@/db.js';

const router: Router = express.Router();

/**
 * 绑定数据接口
 */
interface PartnerBinding {
  code: string;
  short_name: string;
  full_name: string;
}

/**
 * 数据库查询结果
 */
interface ConflictResult {
  code: string;
  short_name: string;
  full_name: string;
}

/**
 * GET /api/partners
 * 获取客户/供应商列表
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
 * 新增客户/供应商
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
        res.status(400).json({ error: '客户/供应商代号或简称已存在' });
      } else {
        res.status(500).json({ error: err.message });
      }
      return;
    }
    res.json({ short_name, message: '客户/供应商创建成功' });
  });
});

/**
 * PUT /api/partners/:short_name
 * 修改客户/供应商
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
      res.status(404).json({ error: '客户/供应商不存在' });
      return;
    }
    
    res.json({ message: '客户/供应商更新成功' });
  });
});

/**
 * DELETE /api/partners/:short_name
 * 删除客户/供应商
 */
router.delete('/:short_name', (req: Request, res: Response): void => {
  const { short_name } = req.params;
  
  db.run('DELETE FROM partners WHERE short_name = ?', [short_name], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: '客户/供应商不存在' });
      return;
    }
    
    res.json({ message: '客户/供应商删除成功' });
  });
});

/**
 * POST /api/partners/bindings
 * 批量/单条设置代号-简称-全称强绑定
 */
router.post('/bindings', (req: Request, res: Response): void => {
  const bindings: PartnerBinding[] = Array.isArray(req.body) ? req.body : [req.body];
  
  if (!bindings.length) {
    res.status(400).json({ error: '无绑定数据' });
    return;
  }
  
  // 校验唯一性和一一对应
  const codes = new Set<string>();
  const shorts = new Set<string>();
  const fulls = new Set<string>();
  
  for (const b of bindings) {
    if (!b.code || !b.short_name || !b.full_name) {
      res.status(400).json({ error: '三项均不能为空' });
      return;
    }
    if (codes.has(b.code) || shorts.has(b.short_name) || fulls.has(b.full_name)) {
      res.status(400).json({ error: '批量数据内有重复' });
      return;
    }
    codes.add(b.code);
    shorts.add(b.short_name);
    fulls.add(b.full_name);
  }
  
  // 检查数据库冲突
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
      res.status(400).json({ error: '与现有数据冲突', conflicts: rows });
      return;
    }
    
    // 插入/更新
    const stmt = db.prepare('INSERT OR REPLACE INTO partners (code, short_name, full_name) VALUES (?, ?, ?)');
    for (const b of bindings) {
      stmt.run([b.code, b.short_name, b.full_name]);
    }
    stmt.finalize((err2) => {
      if (err2) {
        res.status(500).json({ error: err2.message });
        return;
      }
      res.json({ message: '绑定成功' });
    });
  });
});

export default router;