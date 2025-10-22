/**
 * 产品价格路由
 * 管理产品价格信息，包括查询、新增、修改和删除
 */
import express, { type Router, type Request, type Response } from 'express';
import db from '@/db.js';

const router: Router = express.Router();

/**
 * 数据库查询结果类型
 */
interface CountResult {
  total: number;
}

interface UnitPriceResult {
  unit_price: number;
}

/**
 * GET /api/product-prices
 * 获取产品价格列表（支持分页与筛选）
 */
router.get('/', (req: Request, res: Response): void => {
  const { partner_short_name, product_model, effective_date } = req.query;
  let { page = 1 } = req.query;
  const limit = 10; // 固定每页10条

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

  // 分页
  const offset = (Number(page) - 1) * limit;
  const listSql = `SELECT *${baseWhere}${orderBy} LIMIT ? OFFSET ?`;
  const listParams = [...whereParams, limit, offset];

  db.all(listSql, listParams, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    // 统计总数
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
 * 获取特定产品在特定日期的价格
 */
router.get('/current', (req: Request, res: Response): void => {
  const { partner_short_name, product_model, date } = req.query;
  
  if (!partner_short_name || !product_model) {
    res.status(400).json({ error: '缺少必要参数：partner_short_name 和 product_model' });
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
      res.status(404).json({ error: '未找到有效价格' });
      return;
    }
    
    res.json({ data: row });
  });
});

/**
 * POST /api/product-prices
 * 新增产品价格
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
    
    res.json({ id: this.lastID, message: '产品价格创建成功' });
  });
});

/**
 * PUT /api/product-prices/:id
 * 修改产品价格
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
      res.status(404).json({ error: '产品价格不存在' });
      return;
    }
    
    res.json({ message: '产品价格更新成功' });
  });
});

/**
 * DELETE /api/product-prices/:id
 * 删除产品价格
 */
router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  
  db.run('DELETE FROM product_prices WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: '产品价格不存在' });
      return;
    }
    
    res.json({ message: '产品价格删除成功' });
  });
});

/**
 * GET /api/product-prices/auto
 * 自动获取产品价格（完全匹配且生效日期<=指定日期，取最晚的）
 */
router.get('/auto', (req: Request, res: Response): void => {
  const { partner_short_name, product_model, date } = req.query;
  
  if (!partner_short_name || !product_model || !date) {
    res.status(400).json({ error: '缺少必要参数：partner_short_name, product_model, date' });
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
      res.status(404).json({ error: '未找到匹配的单价' });
      return;
    }
    
    res.json({ unit_price: row.unit_price });
  });
});

export default router;