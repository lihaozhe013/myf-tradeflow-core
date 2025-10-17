import express, { Request, Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '@/db.js';
import { getAllStockData } from '@/utils/stockCacheService.js';
import decimalCalc from '@/utils/decimalCalculator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router: Router = express.Router();

// ========== Type Definitions ==========

interface AvgCostRow {
  product_model: string;
  avg_cost_price: number;
  total_inbound_quantity: number;
}

interface OutboundCostRow {
  product_model: string;
  quantity: number;
  selling_price: number;
}

interface SpecialIncomeRow {
  special_income: number;
}

interface AvgCostData {
  avg_cost_price: number;
  total_inbound_quantity: number;
}

interface CountsRow {
  total_inbound: number;
  total_outbound: number;
  suppliers_count: number;
  customers_count: number;
  products_count: number;
}

interface PurchaseAmountRow {
  normal_purchase: number;
  special_income: number;
}

interface SalesAmountRow {
  normal_sales: number;
  special_expense: number;
}

interface OverviewStats {
  total_inbound: number;
  total_outbound: number;
  suppliers_count: number;
  customers_count: number;
  products_count: number;
  total_purchase_amount: number;
  total_sales_amount: number;
  sold_goods_cost: number;
  stocked_products: number;
}

interface TopSalesProduct {
  product_model: string;
  total_sales: number;
}

interface MonthlyStockChange {
  product_model: string;
  month_start_stock: number;
  current_stock: number;
  monthly_change: number;
  query_date: string;
}

interface ProductModelRow {
  product_model: string;
}

interface MonthlyQuantityRow {
  total?: number;
  total_inbound?: number;
  total_outbound?: number;
}

interface StatsCache {
  out_of_stock_products?: { product_model: string }[];
  overview?: OverviewStats;
  top_sales_products?: TopSalesProduct[];
  monthly_stock_changes?: Record<string, MonthlyStockChange>;
  [key: string]: any;
}

type ErrorCallback<T> = (err: Error | null, result?: T) => void;

// ========== Helper Functions ==========

/**
 * 计算已售商品的真实成本（加权平均成本法）
 * 入库负数单价商品作为特殊收入，减少成本
 * @param callback 回调函数 (err, totalCost)
 */
function calculateSoldGoodsCost(callback: ErrorCallback<number>): void {
  // 1. 计算每个产品的加权平均入库价格（只计算正数单价的入库记录）
  db.all<AvgCostRow>(
    `
    SELECT 
      product_model,
      SUM(quantity * unit_price) / SUM(quantity) as avg_cost_price,
      SUM(quantity) as total_inbound_quantity
    FROM inbound_records 
    WHERE unit_price >= 0
    GROUP BY product_model
  `,
    [],
    (err, avgCostData) => {
      if (err) return callback(err);

      // 转换为Map便于查找，使用 decimal.js 处理数据
      const avgCostMap: Record<string, AvgCostData> = {};
      avgCostData.forEach((item) => {
        avgCostMap[item.product_model] = {
          avg_cost_price: decimalCalc.fromSqlResult(item.avg_cost_price, 0, 4),
          total_inbound_quantity: decimalCalc.fromSqlResult(item.total_inbound_quantity, 0, 0),
        };
      });

      // 2. 获取所有出库记录（只计算正数单价的记录用于成本计算）
      db.all<OutboundCostRow>(
        `
      SELECT product_model, quantity, unit_price as selling_price
      FROM outbound_records
      WHERE unit_price >= 0
    `,
        [],
        (err2, outboundRecords) => {
          if (err2) return callback(err2);

          if (outboundRecords.length === 0) {
            return callback(null, 0);
          }

          let totalSoldGoodsCost = decimalCalc.decimal(0);

          // 3. 使用平均成本计算每个销售记录的成本（只计算正数单价商品）
          outboundRecords.forEach((outRecord) => {
            const productModel = outRecord.product_model;
            const soldQuantity = decimalCalc.decimal(outRecord.quantity);
            const sellingPrice = decimalCalc.fromSqlResult(outRecord.selling_price, 0, 4);

            if (avgCostMap[productModel]) {
              // 使用该产品的加权平均入库价格
              const avgCost = decimalCalc.decimal(avgCostMap[productModel].avg_cost_price);
              const cost = decimalCalc.multiply(soldQuantity, avgCost);
              totalSoldGoodsCost = totalSoldGoodsCost.add(cost);
            } else {
              // 如果没有对应的入库记录，使用出库价格作为成本（保守估计）
              const cost = decimalCalc.multiply(soldQuantity, sellingPrice);
              totalSoldGoodsCost = totalSoldGoodsCost.add(cost);
            }
          });

          // 4. 计算入库负数单价商品的特殊收入，减少总成本
          db.get<SpecialIncomeRow>(
            `
        SELECT COALESCE(SUM(ABS(quantity * unit_price)), 0) as special_income
        FROM inbound_records 
        WHERE unit_price < 0
      `,
            [],
            (err3, specialIncomeRow) => {
              if (err3) return callback(err3);

              const specialIncome = decimalCalc.fromSqlResult(specialIncomeRow!.special_income, 0, 2);
              const finalCost = decimalCalc.subtract(totalSoldGoodsCost, specialIncome);

              // 确保成本不为负数并保留两位小数
              const result = decimalCalc.toDbNumber(
                decimalCalc.decimal(Math.max(0, finalCost.toNumber())),
                2
              );
              callback(null, result);
            }
          );
        }
      );
    }
  );
}

// ========== Route Handlers ==========

// 获取系统统计数据
// GET 只读缓存
router.get('/stats', (_req: Request, res: Response) => {
  const statsFile = path.resolve(__dirname, '../../data/overview-stats.json');
  if (fs.existsSync(statsFile)) {
    try {
      const json = fs.readFileSync(statsFile, 'utf-8');
      return res.json(JSON.parse(json));
    } catch (e) {
      // 读取失败则继续重新计算
    }
  }
  // 缓存不存在或读取失败，返回空或错误
  return res.status(503).json({ error: '统计数据未生成，请先刷新。' });
});

// POST 强制刷新并写入缓存（含top_sales_products和monthly_stock_changes）
router.post('/stats', (_req: Request, res: Response) => {
  const statsFile = path.resolve(__dirname, '../../data/overview-stats.json');
  const stats: StatsCache = {};
  let completed = 0;
  const totalQueries = 4; // 增加到4个查询

  const queries: Array<{
    key: string;
    customHandler: (callback: ErrorCallback<any>) => void;
  }> = [
    {
      key: 'out_of_stock_products',
      customHandler: (callback) => {
        getAllStockData((err, stockData) => {
          if (err) return callback(err);
          const outOfStockProducts = Object.entries(stockData!)
            .filter(([, data]) => data.current_stock <= 0)
            .map(([product_model]) => ({ product_model }));
          callback(null, outOfStockProducts);
        });
      },
    },
    {
      key: 'overview',
      customHandler: (callback) => {
        // 分别查询各个统计数据，避免复杂的嵌套查询
        const queries: Record<string, string> = {
          counts: `
            SELECT 
              (SELECT COUNT(*) FROM inbound_records) as total_inbound,
              (SELECT COUNT(*) FROM outbound_records) as total_outbound,
              (SELECT COUNT(*) FROM partners WHERE type = 0) as suppliers_count,
              (SELECT COUNT(*) FROM partners WHERE type = 1) as customers_count,
              (SELECT COUNT(*) FROM products) as products_count
          `,
          purchase_amount: `
            SELECT 
              COALESCE(SUM(quantity * unit_price), 0) as normal_purchase,
              COALESCE((SELECT SUM(ABS(quantity * unit_price)) FROM inbound_records WHERE unit_price < 0), 0) as special_income
            FROM inbound_records 
            WHERE unit_price >= 0
          `,
          sales_amount: `
            SELECT 
              COALESCE(SUM(quantity * unit_price), 0) as normal_sales,
              COALESCE((SELECT SUM(ABS(quantity * unit_price)) FROM outbound_records WHERE unit_price < 0), 0) as special_expense
            FROM outbound_records 
            WHERE unit_price >= 0
          `,
        };

        const results: Record<string, any> = {};
        let queryCompleted = 0;
        const totalSubQueries = Object.keys(queries).length;

        Object.entries(queries).forEach(([key, sql]) => {
          if (key === 'counts') {
            db.get<CountsRow>(sql, [], (err, row) => {
              if (err) {
                console.error(`Error in ${key} query:`, err);
                return callback(err);
              }

              results[key] = row;
              queryCompleted++;

              if (queryCompleted === totalSubQueries) {
                processOverviewResults(results, callback);
              }
            });
          } else if (key === 'purchase_amount') {
            db.get<PurchaseAmountRow>(sql, [], (err, row) => {
              if (err) {
                console.error(`Error in ${key} query:`, err);
                return callback(err);
              }

              results[key] = row;
              queryCompleted++;

              if (queryCompleted === totalSubQueries) {
                processOverviewResults(results, callback);
              }
            });
          } else if (key === 'sales_amount') {
            db.get<SalesAmountRow>(sql, [], (err, row) => {
              if (err) {
                console.error(`Error in ${key} query:`, err);
                return callback(err);
              }

              results[key] = row;
              queryCompleted++;

              if (queryCompleted === totalSubQueries) {
                processOverviewResults(results, callback);
              }
            });
          }
        });

        function processOverviewResults(results: Record<string, any>, callback: ErrorCallback<OverviewStats>) {
          // 合并结果，使用 decimal.js 精确计算
          const normalPurchase = decimalCalc.fromSqlResult(results['purchase_amount'].normal_purchase, 0);
          const specialIncome = decimalCalc.fromSqlResult(results['purchase_amount'].special_income, 0);
          const normalSales = decimalCalc.fromSqlResult(results['sales_amount'].normal_sales, 0);
          const specialExpense = decimalCalc.fromSqlResult(results['sales_amount'].special_expense, 0);

          const finalResult = {
            ...results['counts'],
            // 总采购金额 = 正常采购 - 特殊收入（入库负数商品）
            total_purchase_amount: decimalCalc.toDbNumber(decimalCalc.subtract(normalPurchase, specialIncome)),
            // 总销售额 = 正常销售 - 特殊支出（出库负数商品）
            total_sales_amount: decimalCalc.toDbNumber(decimalCalc.subtract(normalSales, specialExpense)),
          };

          // 计算已售商品的真实成本
          calculateSoldGoodsCost((costErr, soldGoodsCost) => {
            if (costErr) return callback(costErr);

            getAllStockData((stockErr, stockData) => {
              if (stockErr) return callback(stockErr);
              const result: OverviewStats = {
                ...finalResult,
                sold_goods_cost: decimalCalc.toDbNumber(soldGoodsCost!),
                stocked_products: Object.keys(stockData!).length,
              };
              callback(null, result);
            });
          });
        }
      },
    },
    {
      key: 'top_sales_products',
      customHandler: (callback) => {
        // 查询所有商品销售额，按降序排列（只计算正数单价的商品）
        const sql = `
          SELECT product_model, SUM(quantity * unit_price) as total_sales
          FROM outbound_records
          WHERE unit_price >= 0
          GROUP BY product_model
          ORDER BY total_sales DESC
        `;
        const dbLimit = 100;
        db.all<TopSalesProduct>(sql + ` LIMIT ${dbLimit}`, [], (err, rows) => {
          if (err) return callback(err);

          // 使用 decimal.js 处理销售额数据，确保精度
          const processedRows = rows.map((row) => ({
            product_model: row.product_model,
            total_sales: decimalCalc.fromSqlResult(row.total_sales, 0, 2),
          }));

          const topN = 10;
          const top = processedRows.slice(0, topN);
          const others = processedRows.slice(topN);

          // 使用 decimal.js 计算"其他"类别的总和
          let otherTotalDecimal = decimalCalc.decimal(0);
          others.forEach(r => {
            otherTotalDecimal = decimalCalc.add(otherTotalDecimal, r.total_sales);
          });
          const otherTotal = decimalCalc.toDbNumber(otherTotalDecimal, 2);

          const result: TopSalesProduct[] = [...top];
          if (otherTotal > 0) {
            result.push({ product_model: '其他', total_sales: otherTotal });
          }
          callback(null, result);
        });
      },
    },
    {
      key: 'monthly_stock_changes',
      customHandler: (callback) => {
        // 获取本月第一天的日期
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthStartStr = monthStart.toISOString().split('T')[0];

        // 获取所有产品型号
        db.all<ProductModelRow>('SELECT DISTINCT product_model FROM products', [], (err, products) => {
          if (err) return callback(err);

          if (products.length === 0) {
            return callback(null, {});
          }

          const monthlyChanges: Record<string, MonthlyStockChange> = {};
          let productCompleted = 0;

          products.forEach(({ product_model }) => {
            const queries: Record<string, string> = {
              beforeMonthInbound: `
                SELECT COALESCE(SUM(quantity), 0) as total
                FROM inbound_records 
                WHERE product_model = ? AND date(inbound_date) < ?
              `,
              beforeMonthOutbound: `
                SELECT COALESCE(SUM(quantity), 0) as total
                FROM outbound_records 
                WHERE product_model = ? AND date(outbound_date) < ?
              `,
              monthlyInbound: `
                SELECT COALESCE(SUM(quantity), 0) as total_inbound
                FROM inbound_records 
                WHERE product_model = ? AND date(inbound_date) >= ?
              `,
              monthlyOutbound: `
                SELECT COALESCE(SUM(quantity), 0) as total_outbound
                FROM outbound_records 
                WHERE product_model = ? AND date(outbound_date) >= ?
              `,
            };

            const results: Record<string, number> = {};
            let queryCompleted = 0;
            const totalSubQueries = Object.keys(queries).length;

            Object.keys(queries).forEach((key) => {
              const params = [product_model, monthStartStr];
              const sql = queries[key]!;

              db.get<MonthlyQuantityRow>(sql, params, (err2, row) => {
                if (!err2) {
                  if (key === 'beforeMonthInbound') {
                    results['before_month_inbound'] = row!.total || 0;
                  } else if (key === 'beforeMonthOutbound') {
                    results['before_month_outbound'] = row!.total || 0;
                  } else if (key === 'monthlyInbound') {
                    results['total_inbound'] = row!.total_inbound || 0;
                  } else if (key === 'monthlyOutbound') {
                    results['total_outbound'] = row!.total_outbound || 0;
                  }
                }

                queryCompleted++;
                if (queryCompleted === totalSubQueries) {
                  // 使用 decimal.js 计算该产品的本月库存变化，确保精度
                  const beforeMonthInbound = decimalCalc.fromSqlResult(results['before_month_inbound'], 0, 0);
                  const beforeMonthOutbound = decimalCalc.fromSqlResult(results['before_month_outbound'], 0, 0);
                  const totalInbound = decimalCalc.fromSqlResult(results['total_inbound'], 0, 0);
                  const totalOutbound = decimalCalc.fromSqlResult(results['total_outbound'], 0, 0);

                  const monthStartStock = decimalCalc.toDbNumber(
                    decimalCalc.subtract(beforeMonthInbound, beforeMonthOutbound),
                    0
                  );
                  const monthlyChange = decimalCalc.toDbNumber(decimalCalc.subtract(totalInbound, totalOutbound), 0);
                  const currentStock = decimalCalc.toDbNumber(decimalCalc.add(monthStartStock, monthlyChange), 0);

                  monthlyChanges[product_model] = {
                    product_model,
                    month_start_stock: monthStartStock,
                    current_stock: currentStock,
                    monthly_change: monthlyChange,
                    query_date: new Date().toISOString(),
                  };

                  productCompleted++;
                  if (productCompleted === products.length) {
                    callback(null, monthlyChanges);
                  }
                }
              });
            });
          });
        });
      },
    },
  ];

  queries.forEach(({ key, customHandler }) => {
    customHandler((err, result) => {
      if (err) {
        console.error(`Error in ${key} customHandler:`, err);
        stats[key] = { error: err.message };
      } else {
        stats[key] = result;
      }
      completed++;
      if (completed === totalQueries) {
        try {
          fs.mkdirSync(path.dirname(statsFile), { recursive: true });
          fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2), 'utf-8');
        } catch (e) {
          console.error('写入 overview-stats.json 失败:', e);
        }
        res.json(stats);
      }
    });
  });
});

// 调试接口：获取所有表的数据（保留原有功能）
router.get('/all-tables', (_req: Request, res: Response) => {
  const queries: Record<string, string> = {
    inbound_records: 'SELECT * FROM inbound_records ORDER BY id DESC',
    outbound_records: 'SELECT * FROM outbound_records ORDER BY id DESC',
    partners: 'SELECT * FROM partners ORDER BY short_name',
    product_prices: 'SELECT * FROM product_prices ORDER BY effective_date DESC',
  };

  const results: Record<string, any> = {};
  const tableNames = Object.keys(queries);
  let completed = 0;

  tableNames.forEach((tableName) => {
    const sql = queries[tableName]!;
    db.all(sql, [], (err, rows) => {
      if (err) {
        console.error(`Error querying ${tableName}:`, err);
        results[tableName] = { error: err.message };
      } else {
        results[tableName] = rows;
      }

      completed++;
      if (completed === tableNames.length) {
        res.json(results);
      }
    });
  });
});

// 获取销售额前10的商品及"其他"合计（从overview-stats.json读取）
router.get('/top-sales-products', (_req: Request, res: Response) => {
  const statsFile = path.resolve(__dirname, '../../data/overview-stats.json');
  if (fs.existsSync(statsFile)) {
    try {
      const json = fs.readFileSync(statsFile, 'utf-8');
      const stats: StatsCache = JSON.parse(json);
      if (Array.isArray(stats.top_sales_products)) {
        return res.json({ success: true, data: stats.top_sales_products });
      }
    } catch (e) {
      // 读取失败
    }
  }
  return res.status(503).json({ error: '统计数据未生成，请先刷新。' });
});

// 获取指定产品的本月库存变化量（从overview-stats.json读取）
router.get('/monthly-stock-change/:productModel', (req: Request, res: Response) => {
  const productModel = req.params['productModel'];

  if (!productModel) {
    return res.status(400).json({
      success: false,
      message: '产品型号不能为空',
    });
  }

  const statsFile = path.resolve(__dirname, '../../data/overview-stats.json');
  if (fs.existsSync(statsFile)) {
    try {
      const json = fs.readFileSync(statsFile, 'utf-8');
      const stats: StatsCache = JSON.parse(json);

      // 从缓存中查找指定产品的本月库存变化数据
      if (stats.monthly_stock_changes && stats.monthly_stock_changes[productModel]) {
        return res.json({
          success: true,
          data: stats.monthly_stock_changes[productModel],
        });
      } else {
        return res.json({
          success: false,
          message: '未找到该产品的本月库存变化数据，请先刷新统计数据',
        });
      }
    } catch (e) {
      // 读取失败
    }
  }

  return res.status(503).json({
    success: false,
    error: '统计数据未生成，请先刷新。',
  });
});

export default router;
