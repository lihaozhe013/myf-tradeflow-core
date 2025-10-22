import { Router, Request, Response } from 'express';
import decimalCalc from '@/utils/decimalCalculator';

// 工具模块（TS + ESM，使用路径别名）
import {
  calculateFilteredSoldGoodsCost,
  calculateDetailAnalysis,
  calculateSalesData,
  getFilterOptions,
  validateAnalysisParams,
  validateBasicParams,
  generateCacheKey,
  generateDetailCacheKey,
  readCache,
  writeCache
} from '@/routes/analysis/utils';
import type { SalesData, DetailItem, FilterOptions } from '@/routes/analysis/utils/types';

const router = Router();

// GET /api/analysis/data - 获取分析数据（从缓存读取）
router.get('/data', (req: Request, res: Response) => {
  const { start_date, end_date, customer_code, product_model } = req.query as Record<string, string | undefined>;

  // 参数校验
  const validation = validateBasicParams({ start_date, end_date });
  if (!validation.isValid) {
    res.status(400).json({
      success: false,
      message: validation.error
    });
    return;
  }

  // 生成缓存键
  const cacheKey = generateCacheKey(start_date!, end_date!, customer_code, product_model);

  // 读取缓存
  const cache = readCache();

  if (cache[cacheKey]) {
    res.json({
      success: true,
      data: cache[cacheKey]
    });
    return;
  }

  // 缓存不存在
  res.status(503).json({
    success: false,
    error: '分析数据未生成，请先点击刷新按钮计算数据。'
  });
  return;
});

// GET /api/analysis/detail - 获取详细分析数据（从缓存读取）
router.get('/detail', (req: Request, res: Response) => {
  const { start_date, end_date, customer_code, product_model } = req.query as Record<string, string | undefined>;

  // 参数校验
  const validation = validateBasicParams({ start_date, end_date });
  if (!validation.isValid) {
    res.status(400).json({
      success: false,
      message: validation.error
    });
    return;
  }

  // 生成详细分析缓存键
  const detailCacheKey = generateDetailCacheKey(start_date!, end_date!, customer_code, product_model);

  // 读取缓存
  const cache = readCache();

  if (cache[detailCacheKey]) {
    res.json({
      success: true,
      data: cache[detailCacheKey]
    });
    return;
  }

  // 缓存不存在
  res.json({
    success: true,
    data: []
  });
  return;
});

// POST /api/analysis/refresh - 刷新分析数据（重新计算并写入缓存）
router.post('/refresh', (req: Request, res: Response) => {
  const { start_date, end_date, customer_code, product_model } = req.body as Record<string, string | undefined>;

  // 参数校验
  const validation = validateAnalysisParams({ start_date, end_date, customer_code, product_model });
  if (!validation.isValid) {
    res.status(400).json({
      success: false,
      message: validation.error
    });
    return;
  }

  // 1. 计算销售额
  calculateSalesData(start_date!, end_date!, customer_code, product_model, (salesErr: Error | null, salesData?: SalesData) => {
    if (salesErr || !salesData) {
      console.error('计算销售额失败:', salesErr);
      res.status(500).json({
        success: false,
        message: '计算销售额失败'
      });
      return;
    }

    // 2. 计算成本
  calculateFilteredSoldGoodsCost(start_date!, end_date!, customer_code, product_model, (costErr: Error | null, costAmount?: number) => {
      if (costErr) {
        console.error('计算成本失败:', costErr);
        res.status(500).json({
          success: false,
          message: '计算成本失败'
        });
        return;
      }

      // 3. 使用 decimal.js 精确计算结果
      const salesAmount = salesData.sales_amount;
      const cost = decimalCalc.toDbNumber(costAmount ?? 0, 2);
      const profit = decimalCalc.toDbNumber(decimalCalc.subtract(salesAmount, cost), 2);

      // 计算利润率
      let profitRate = 0;
      if (salesAmount > 0) {
        const rate = decimalCalc.multiply(decimalCalc.divide(profit, salesAmount), 100);
        profitRate = decimalCalc.toDbNumber(rate, 2);
      }

      // 4. 组装结果数据
      const resultData = {
        sales_amount: salesAmount,
        cost_amount: cost,
        profit_amount: profit,
        profit_rate: profitRate,
        query_params: {
          start_date,
          end_date,
          customer_code: customer_code || 'All',
          product_model: product_model || 'All'
        },
        last_updated: new Date().toISOString()
      };

      // 5. 计算详细分析数据
  calculateDetailAnalysis(start_date!, end_date!, customer_code, product_model, (detailErr: Error | null, detailData?: DetailItem[]) => {
        if (detailErr) {
          console.error('计算详细分析数据失败:', detailErr);
          // 即使详细分析失败，也返回基本数据
          detailData = [];
        }

        // 6. 写入缓存
        const cacheKey = generateCacheKey(start_date!, end_date!, customer_code, product_model);
        const detailCacheKey = generateDetailCacheKey(start_date!, end_date!, customer_code, product_model);
        const cache = readCache();

        cache[cacheKey] = resultData as unknown as Record<string, unknown>;
        cache[detailCacheKey] = {
          detail_data: detailData,
          last_updated: new Date().toISOString()
        } as unknown as Record<string, unknown>;

        if (writeCache(cache)) {
          res.json({
            success: true,
            data: resultData
          });
        } else {
          res.status(500).json({
            success: false,
            message: '保存缓存失败'
          });
        }
        return;
      });
    });
  });
});

// GET /api/analysis/filter-options - 获取筛选选项
router.get('/filter-options', (_req: Request, res: Response) => {
  getFilterOptions((err: Error | null, options?: FilterOptions) => {
    if (err || !options) {
      res.status(500).json({
        success: false,
        message: '查询筛选选项失败'
      });
      return;
    }

    res.json({
      success: true,
      ...options
    });
  });
});

// POST /api/analysis/clean-cache - 手动清理过期缓存
router.post('/clean-cache', (_req: Request, res: Response) => {
  try {
    const cache = readCache();
    const originalSize = Object.keys(cache).length;

    if (writeCache(cache)) {
      const newCache = readCache();
      const newSize = Object.keys(newCache).length;
      const cleanedCount = originalSize - newSize;

      res.json({
        success: true,
        message: `清理完成，删除了 ${cleanedCount} 个过期缓存`,
        original_size: originalSize,
        new_size: newSize
      });
    } else {
      res.status(500).json({
        success: false,
        message: '清理缓存失败'
      });
    }
  } catch (error) {
    console.error('清理缓存失败:', error);
    res.status(500).json({
      success: false,
      message: '清理缓存失败'
    });
  }
});

export default router;
