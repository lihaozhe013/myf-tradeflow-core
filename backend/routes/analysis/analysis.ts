import { Router, Request, Response } from "express";
import decimalCalc from "@/utils/decimalCalculator";
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
  writeCache,
} from "@/routes/analysis/utils";
import type {
  SalesData,
  DetailItem,
  FilterOptions,
} from "@/routes/analysis/utils/types";

const router = Router();

// GET /api/analysis/data
router.get("/data", (req: Request, res: Response) => {
  const { start_date, end_date, customer_code, product_model } =
    req.query as Record<string, string | undefined>;

  const validation = validateBasicParams({ start_date, end_date });
  if (!validation.isValid) {
    res.status(400).json({
      success: false,
      message: validation.error,
    });
    return;
  }

  const cacheKey = generateCacheKey(
    start_date!,
    end_date!,
    customer_code,
    product_model
  );
  const cache = readCache();

  if (cache[cacheKey]) {
    res.json({
      success: true,
      data: cache[cacheKey],
    });
    return;
  }

  res.status(503).json({
    success: false,
    error:
      "Analysis data has not been generated. Please click the refresh button to calculate the data.",
  });
  return;
});

// GET /api/analysis/detail
router.get("/detail", (req: Request, res: Response) => {
  const { start_date, end_date, customer_code, product_model } =
    req.query as Record<string, string | undefined>;

  const validation = validateBasicParams({ start_date, end_date });
  if (!validation.isValid) {
    res.status(400).json({
      success: false,
      message: validation.error,
    });
    return;
  }

  const detailCacheKey = generateDetailCacheKey(
    start_date!,
    end_date!,
    customer_code,
    product_model
  );
  const cache = readCache();

  if (cache[detailCacheKey]) {
    res.json({
      success: true,
      data: cache[detailCacheKey],
    });
    return;
  }

  res.json({
    success: true,
    data: [],
  });
  return;
});

// POST /api/analysis/refresh
router.post("/refresh", (req: Request, res: Response) => {
  const { start_date, end_date, customer_code, product_model } =
    req.body as Record<string, string | undefined>;
  const validation = validateAnalysisParams({
    start_date,
    end_date,
    customer_code,
    product_model,
  });
  if (!validation.isValid) {
    res.status(400).json({
      success: false,
      message: validation.error,
    });
    return;
  }
  calculateSalesData(
    start_date!,
    end_date!,
    customer_code,
    product_model,
    (salesErr: Error | null, salesData?: SalesData) => {
      if (salesErr || !salesData) {
        console.error("Failed to calculate sales:", salesErr);
        res.status(500).json({
          success: false,
          message: "Failed to calculate sales",
        });
        return;
      }

      calculateFilteredSoldGoodsCost(
        start_date!,
        end_date!,
        customer_code,
        product_model,
        (costErr: Error | null, costAmount?: number) => {
          if (costErr) {
            console.error("Cost calculation failed:", costErr);
            res.status(500).json({
              success: false,
              message: "Cost calculation failed",
            });
            return;
          }

          const salesAmount = salesData.sales_amount;
          const cost = decimalCalc.toDbNumber(costAmount ?? 0, 2);
          const profit = decimalCalc.toDbNumber(
            decimalCalc.subtract(salesAmount, cost),
            2
          );

          let profitRate = 0;
          if (salesAmount > 0) {
            const rate = decimalCalc.multiply(
              decimalCalc.divide(profit, salesAmount),
              100
            );
            profitRate = decimalCalc.toDbNumber(rate, 2);
          }

          const resultData = {
            sales_amount: salesAmount,
            cost_amount: cost,
            profit_amount: profit,
            profit_rate: profitRate,
            query_params: {
              start_date,
              end_date,
              customer_code: customer_code || "All",
              product_model: product_model || "All",
            },
            last_updated: new Date().toISOString(),
          };

          calculateDetailAnalysis(
            start_date!,
            end_date!,
            customer_code,
            product_model,
            (detailErr: Error | null, detailData?: DetailItem[]) => {
              if (detailErr) {
                console.error("Failed to compute detailed analysis data:", detailErr);
                detailData = [];
              }

              const cacheKey = generateCacheKey(
                start_date!,
                end_date!,
                customer_code,
                product_model
              );
              const detailCacheKey = generateDetailCacheKey(
                start_date!,
                end_date!,
                customer_code,
                product_model
              );
              const cache = readCache();

              cache[cacheKey] = resultData as unknown as Record<
                string,
                unknown
              >;
              cache[detailCacheKey] = {
                detail_data: detailData,
                last_updated: new Date().toISOString(),
              } as unknown as Record<string, unknown>;

              if (writeCache(cache)) {
                res.json({
                  success: true,
                  data: resultData,
                });
              } else {
                res.status(500).json({
                  success: false,
                  message: "Cache save failed",
                });
              }
              return;
            }
          );
        }
      );
    }
  );
});

// GET /api/analysis/filter-options
router.get("/filter-options", (_req: Request, res: Response) => {
  getFilterOptions((err: Error | null, options?: FilterOptions) => {
    if (err || !options) {
      res.status(500).json({
        success: false,
        message: "Query filtering options failed",
      });
      return;
    }

    res.json({
      success: true,
      ...options,
    });
  });
});

// POST /api/analysis/clean-cache
router.post("/clean-cache", (_req: Request, res: Response) => {
  try {
    const cache = readCache();
    const originalSize = Object.keys(cache).length;

    if (writeCache(cache)) {
      const newCache = readCache();
      const newSize = Object.keys(newCache).length;
      const cleanedCount = originalSize - newSize;

      res.json({
        success: true,
        message: `Cleaning completed. ${cleanedCount} expired cache entries deleted.`,
        original_size: originalSize,
        new_size: newSize,
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Cache clearing failed",
      });
    }
  } catch (error) {
    console.error("Cache clearing failed:", error);
    res.status(500).json({
      success: false,
      message: "Cache clearing failed",
    });
  }
});

export default router;
