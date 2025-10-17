/**
 * 出库记录路由
 * 管理出库记录的查询、新增、修改和删除
 */
import express, { type Router, type Request, type Response } from 'express';
import db from '@/db.js';
import decimalCalc from '@/utils/decimalCalculator.js';

const router: Router = express.Router();

/**
 * 数据库查询结果类型
 */
interface CountResult {
  total: number;
}

/**
 * 工具函数：判断查询参数是否有效（排除 '', 'null', 'undefined' 字符串）
 */
function isProvided(val: any): boolean {
  return !(val === undefined || val === null || val === '' || val === 'null' || val === 'undefined');
}

/**
 * GET /api/outbound
 * 获取出库记录列表（支持分页和筛选）
 */
router.get('/', (req: Request, res: Response): void => {
  let { page = 1 } = req.query;
  let pageNum = parseInt(page as string, 10);
  if (!Number.isFinite(pageNum) || pageNum < 1) pageNum = 1;
  const limit = 10; // 固定每页10条
  
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

  // 排序
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

  db.all(sql, params, (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
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
 * POST /api/outbound
 * 新增出库记录
 */
router.post('/', (req: Request, res: Response): void => {
  const {
    customer_code, customer_short_name, customer_full_name, 
    product_code, product_model, quantity, unit_price,
    outbound_date, invoice_date, invoice_number, invoice_image_url, order_number,
    remark
  } = req.body;
  
  const total_price = decimalCalc.calculateTotalPrice(quantity, unit_price);
  
  const sql = `
    INSERT INTO outbound_records 
    (customer_code, customer_short_name, customer_full_name, 
     product_code, product_model, quantity, unit_price, total_price,
     outbound_date, invoice_date, invoice_number, invoice_image_url, order_number,
     remark)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const params = [
    customer_code, customer_short_name, customer_full_name, 
    product_code, product_model, quantity, unit_price, total_price,
    outbound_date, invoice_date, invoice_number, invoice_image_url, order_number,
    remark
  ];
  
  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ id: this.lastID, message: '出库记录创建成功' });
  });
});

/**
 * PUT /api/outbound/:id
 * 修改出库记录
 */
router.put('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const {
    customer_code, customer_short_name, customer_full_name, 
    product_code, product_model, quantity, unit_price,
    outbound_date, invoice_date, invoice_number, invoice_image_url, order_number,
    remark
  } = req.body;
  
  const total_price = decimalCalc.calculateTotalPrice(quantity, unit_price);
  
  const sql = `
    UPDATE outbound_records SET
    customer_code=?, customer_short_name=?, customer_full_name=?, 
    product_code=?, product_model=?, quantity=?, unit_price=?, total_price=?,
    outbound_date=?, invoice_date=?, invoice_number=?, invoice_image_url=?, order_number=?,
    remark=?
    WHERE id=?
  `;
  
  const params = [
    customer_code, customer_short_name, customer_full_name, 
    product_code, product_model, quantity, unit_price, total_price,
    outbound_date, invoice_date, invoice_number, invoice_image_url, order_number,
    remark, id
  ];
  
  db.run(sql, params, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: '出库记录不存在' });
      return;
    }
    
    res.json({ message: '出库记录更新成功' });
  });
});

/**
 * DELETE /api/outbound/:id
 * 删除出库记录
 */
router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  
  db.run('DELETE FROM outbound_records WHERE id = ?', [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: '出库记录不存在' });
      return;
    }
    
    res.json({ message: '出库记录删除成功' });
  });
});

export default router;
