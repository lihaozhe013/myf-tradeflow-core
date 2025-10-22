/**
 * 库存路由
 * 提供库存查询、刷新和总成本估算功能
 */
import express, { type Router, type Request, type Response } from 'express';
import { 
  getStockSummary, 
  refreshStockCache, 
  getStockCache 
} from '@/utils/stockCacheService.js';

const router: Router = express.Router();

/**
 * GET /api/stock
 * 获取库存明细（支持分页和筛选）
 */
router.get('/', (req: Request, res: Response): void => {
  const { product_model, page = 1, limit = 10 } = req.query;
  
  getStockSummary(
    product_model as string | null, 
    Number(page), 
    Number(limit), 
    (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      
      res.json(result);
    }
  );
});

/**
 * GET /api/stock/total-cost-estimate
 * 获取总成本估算
 */
router.get('/total-cost-estimate', (_req: Request, res: Response): void => {
  getStockCache((err, stockData) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ 
      total_cost_estimate: stockData!.total_cost_estimate || 0,
      last_updated: stockData!.last_updated 
    });
  });
});

/**
 * POST /api/stock/refresh
 * 刷新库存缓存
 */
router.post('/refresh', (_req: Request, res: Response): void => {
  refreshStockCache((err, stockData) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    
    res.json({ 
      success: true, 
      message: '库存缓存刷新成功',
      last_updated: stockData!.last_updated,
      products_count: Object.keys(stockData!.products).length
    });
  });
});

export default router; 