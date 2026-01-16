import express, { Request, Response, Router } from 'express';
import fs from 'fs';
import path from 'path';
import db from '@/db.js';
import { getAllInventoryData } from '@/utils/inventoryCacheService.js';
import decimalCalc from '@/utils/decimalCalculator.js';
import { resolveFilesInDataPath } from '@/utils/paths';

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
  inventoryed_products: number;
}

interface TopSalesProduct {
  product_model: string;
  total_sales: number;
}

interface MonthlyInventoryChange {
  product_model: string;
  month_start_inventory: number;
  current_inventory: number;
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
  out_of_inventory_products?: { product_model: string }[];
  overview?: OverviewStats;
  top_sales_products?: TopSalesProduct[];
  monthly_inventory_changes?: Record<string, MonthlyInventoryChange>;
  [key: string]: any;
}

type ErrorCallback<T> = (err: Error | null, result?: T) => void;

// ========== Helper Functions ==========

/**
 * Calculate the real cost of sold goods (weighted average cost method)
 * Inbound records with negative unit prices are treated as special income, reducing costs
 * Only calculates data from the past year
 * @param callback Callback function (err, totalCost)
 */
function calculateSoldGoodsCost(callback: ErrorCallback<number>): void {
  // Get the date one year ago from now
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];

  try {
    // 1. Calculate weighted average inbound price for each product (only positive unit price records from past year)
    const avgCostData = db.prepare(`
      SELECT 
        product_model,
        SUM(quantity * unit_price) / SUM(quantity) as avg_cost_price,
        SUM(quantity) as total_inbound_quantity
      FROM inbound_records 
      WHERE unit_price >= 0 AND date(inbound_date) >= ?
      GROUP BY product_model
    `).all(oneYearAgoStr) as AvgCostRow[];

    // Convert to Map for easy lookup, use decimal.js to handle data
    const avgCostMap: Record<string, AvgCostData> = {};
    avgCostData.forEach((item) => {
      avgCostMap[item.product_model] = {
        avg_cost_price: decimalCalc.fromSqlResult(item.avg_cost_price, 0, 4),
        total_inbound_quantity: decimalCalc.fromSqlResult(item.total_inbound_quantity, 0, 0),
      };
    });

    // 2. Get all outbound records from the past year (only positive unit price records for cost calculation)
    const outboundRecords = db.prepare(`
      SELECT product_model, quantity, unit_price as selling_price
      FROM outbound_records
      WHERE unit_price >= 0 AND date(outbound_date) >= ?
    `).all(oneYearAgoStr) as OutboundCostRow[];

    if (outboundRecords.length === 0) {
      return callback(null, 0);
    }

    let totalSoldGoodsCost = decimalCalc.decimal(0);

    // 3. Use average cost to calculate cost for each sales record (only positive unit price items)
    outboundRecords.forEach((outRecord) => {
      const productModel = outRecord.product_model;
      const soldQuantity = decimalCalc.decimal(outRecord.quantity);
      const sellingPrice = decimalCalc.fromSqlResult(outRecord.selling_price, 0, 4);

      if (avgCostMap[productModel]) {
        // Use weighted average inbound price for this product
        const avgCost = decimalCalc.decimal(avgCostMap[productModel].avg_cost_price);
        const cost = decimalCalc.multiply(soldQuantity, avgCost);
        totalSoldGoodsCost = totalSoldGoodsCost.add(cost);
      } else {
        // If no corresponding inbound records, use outbound price as cost (conservative estimate)
        const cost = decimalCalc.multiply(soldQuantity, sellingPrice);
        totalSoldGoodsCost = totalSoldGoodsCost.add(cost);
      }
    });

    // 4. Calculate special income from inbound negative unit price items from past year, reduce total cost
    const specialIncomeRow = db.prepare(`
      SELECT COALESCE(SUM(ABS(quantity * unit_price)), 0) as special_income
      FROM inbound_records 
      WHERE unit_price < 0 AND date(inbound_date) >= ?
    `).get(oneYearAgoStr) as SpecialIncomeRow;

    const specialIncome = decimalCalc.fromSqlResult(specialIncomeRow.special_income, 0, 2);
    const finalCost = decimalCalc.subtract(totalSoldGoodsCost, specialIncome);

    // Ensure cost is not negative and keep two decimal places
    const result = decimalCalc.toDbNumber(
      decimalCalc.decimal(Math.max(0, finalCost.toNumber())),
      2
    );
    callback(null, result);
  } catch (err) {
    callback(err as Error);
  }
}

// ========== Route Handlers ==========

// 获取系统统计数据
// GET Read cache only
router.get('/stats', (_req: Request, res: Response) => {
  const statsFile = resolveFilesInDataPath("overview-stats.json");
  if (fs.existsSync(statsFile)) {
    try {
      const json = fs.readFileSync(statsFile, 'utf-8');
      return res.json(JSON.parse(json));
    } catch (e) {
      // If reading fails, continue to recalculate
    }
  }
  // Cache doesn't exist or reading failed, return empty or error
  return res.status(503).json({ error: 'Statistics data not generated, please refresh first.' });
});

// POST Force refresh and write to cache (including top_sales_products and monthly_inventory_changes)
router.post('/stats', (_req: Request, res: Response) => {
  const statsFile = resolveFilesInDataPath("overview-stats.json");
  const stats: StatsCache = {};
  let completed = 0;
  const totalQueries = 4; // Keep 4 queries

  // Get the date one year ago from now
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];

  const queries: Array<{
    key: string;
    customHandler: (callback: ErrorCallback<any>) => void;
  }> = [
    {
      key: 'out_of_inventory_products',
      customHandler: (callback) => {
        getAllInventoryData((err, inventoryData) => {
          if (err) return callback(err);
          const outOfStockProducts = Object.entries(inventoryData!)
            .filter(([, data]) => data.current_inventory <= 0)
            .map(([product_model]) => ({ product_model }));
          callback(null, outOfStockProducts);
        });
      },
    },
    {
      key: 'overview',
      customHandler: (callback) => {
        try {
          // Query each statistic separately to avoid complex nested queries, only include past year data
          const counts = db.prepare(`
            SELECT 
              (SELECT COUNT(*) FROM inbound_records WHERE date(inbound_date) >= '${oneYearAgoStr}') as total_inbound,
              (SELECT COUNT(*) FROM outbound_records WHERE date(outbound_date) >= '${oneYearAgoStr}') as total_outbound,
              (SELECT COUNT(*) FROM partners WHERE type = 0) as suppliers_count,
              (SELECT COUNT(*) FROM partners WHERE type = 1) as customers_count,
              (SELECT COUNT(*) FROM products) as products_count
          `).get() as CountsRow;
          
          const purchase_amount = db.prepare(`
            SELECT 
              COALESCE(SUM(quantity * unit_price), 0) as normal_purchase,
              COALESCE((SELECT SUM(ABS(quantity * unit_price)) FROM inbound_records WHERE unit_price < 0 AND date(inbound_date) >= '${oneYearAgoStr}'), 0) as special_income
            FROM inbound_records 
            WHERE unit_price >= 0 AND date(inbound_date) >= '${oneYearAgoStr}'
          `).get() as PurchaseAmountRow;
          
          const sales_amount = db.prepare(`
            SELECT 
              COALESCE(SUM(quantity * unit_price), 0) as normal_sales,
              COALESCE((SELECT SUM(ABS(quantity * unit_price)) FROM outbound_records WHERE unit_price < 0 AND date(outbound_date) >= '${oneYearAgoStr}'), 0) as special_expense
            FROM outbound_records 
            WHERE unit_price >= 0 AND date(outbound_date) >= '${oneYearAgoStr}'
          `).get() as SalesAmountRow;

          // Merge results, use decimal.js for precise calculation
          const normalPurchase = decimalCalc.fromSqlResult(purchase_amount.normal_purchase, 0);
          const specialIncome = decimalCalc.fromSqlResult(purchase_amount.special_income, 0);
          const normalSales = decimalCalc.fromSqlResult(sales_amount.normal_sales, 0);
          const specialExpense = decimalCalc.fromSqlResult(sales_amount.special_expense, 0);

          const finalResult = {
            ...counts,
            // Total purchase amount = normal purchase - special income (inbound negative price items)
            total_purchase_amount: decimalCalc.toDbNumber(decimalCalc.subtract(normalPurchase, specialIncome)),
            // Total sales amount = normal sales - special expense (outbound negative price items)
            total_sales_amount: decimalCalc.toDbNumber(decimalCalc.subtract(normalSales, specialExpense)),
          };

          // Calculate real cost of sold goods
          calculateSoldGoodsCost((costErr, soldGoodsCost) => {
            if (costErr) return callback(costErr);

            getAllInventoryData((inventoryErr, inventoryData) => {
              if (inventoryErr) return callback(inventoryErr);
              const result: OverviewStats = {
                ...finalResult,
                sold_goods_cost: decimalCalc.toDbNumber(soldGoodsCost!),
                inventoryed_products: Object.keys(inventoryData!).length,
              };
              callback(null, result);
            });
          });
        } catch (err) {
          callback(err as Error);
        }
      },
    },
    {
      key: 'top_sales_products',
      customHandler: (callback) => {
        try {
          // Query all product sales amounts from past year, order by descending (only positive unit price items)
          const sql = `
            SELECT product_model, SUM(quantity * unit_price) as total_sales
            FROM outbound_records
            WHERE unit_price >= 0 AND date(outbound_date) >= ?
            GROUP BY product_model
            ORDER BY total_sales DESC
            LIMIT 100
          `;
          const rows = db.prepare(sql).all(oneYearAgoStr) as TopSalesProduct[];

          // Use decimal.js to process sales amount data, ensure precision
          const processedRows = rows.map((row) => ({
            product_model: row.product_model,
            total_sales: decimalCalc.fromSqlResult(row.total_sales, 0, 2),
          }));

          const topN = 10;
          const top = processedRows.slice(0, topN);
          const others = processedRows.slice(topN);

          // Use decimal.js to calculate sum for "others" category
          let otherTotalDecimal = decimalCalc.decimal(0);
          others.forEach(r => {
            otherTotalDecimal = decimalCalc.add(otherTotalDecimal, r.total_sales);
          });
          const otherTotal = decimalCalc.toDbNumber(otherTotalDecimal, 2);

          const result: TopSalesProduct[] = [...top];
          if (otherTotal > 0) {
            result.push({ product_model: 'Others', total_sales: otherTotal });
          }
          callback(null, result);
        } catch (err) {
          callback(err as Error);
        }
      },
    },
    {
      key: 'monthly_inventory_changes',
      customHandler: (callback) => {
        // Get first day of current month
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthStartStr = monthStart.toISOString().split('T')[0];

        // Get all product models
        try {
          const products = db.prepare('SELECT DISTINCT product_model FROM products').all() as ProductModelRow[];

          if (products.length === 0) {
            return callback(null, {});
          }

          const monthlyChanges: Record<string, MonthlyInventoryChange> = {};

          products.forEach(({ product_model }) => {
            const beforeMonthInbound = db.prepare(`
              SELECT COALESCE(SUM(quantity), 0) as total
              FROM inbound_records 
              WHERE product_model = ? AND date(inbound_date) < ?
            `).get(product_model, monthStartStr) as MonthlyQuantityRow;
            
            const beforeMonthOutbound = db.prepare(`
              SELECT COALESCE(SUM(quantity), 0) as total
              FROM outbound_records 
              WHERE product_model = ? AND date(outbound_date) < ?
            `).get(product_model, monthStartStr) as MonthlyQuantityRow;
            
            const monthlyInbound = db.prepare(`
              SELECT COALESCE(SUM(quantity), 0) as total_inbound
              FROM inbound_records 
              WHERE product_model = ? AND date(inbound_date) >= ?
            `).get(product_model, monthStartStr) as MonthlyQuantityRow;
            
            const monthlyOutbound = db.prepare(`
              SELECT COALESCE(SUM(quantity), 0) as total_outbound
              FROM outbound_records 
              WHERE product_model = ? AND date(outbound_date) >= ?
            `).get(product_model, monthStartStr) as MonthlyQuantityRow;

            // Use decimal.js to calculate monthly inventory change for this product, ensure precision
            const beforeMonthInboundQty = decimalCalc.fromSqlResult(beforeMonthInbound.total || 0, 0, 0);
            const beforeMonthOutboundQty = decimalCalc.fromSqlResult(beforeMonthOutbound.total || 0, 0, 0);
            const totalInbound = decimalCalc.fromSqlResult(monthlyInbound.total_inbound || 0, 0, 0);
            const totalOutbound = decimalCalc.fromSqlResult(monthlyOutbound.total_outbound || 0, 0, 0);

            const monthStartInventory = decimalCalc.toDbNumber(
              decimalCalc.subtract(beforeMonthInboundQty, beforeMonthOutboundQty),
              0
            );
            const monthlyChange = decimalCalc.toDbNumber(decimalCalc.subtract(totalInbound, totalOutbound), 0);
            const currentInventory = decimalCalc.toDbNumber(decimalCalc.add(monthStartInventory, monthlyChange), 0);

            monthlyChanges[product_model] = {
              product_model,
              month_start_inventory: monthStartInventory,
              current_inventory: currentInventory,
              monthly_change: monthlyChange,
              query_date: new Date().toISOString(),
            };
          });

          callback(null, monthlyChanges);
        } catch (err) {
          callback(err as Error);
        }
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
          console.error('Failed to write overview-stats.json:', e);
        }
        res.json(stats);
      }
    });
  });
});

// Debug interface: Get all table data (preserve original functionality)
// router.get('/all-tables', (_req: Request, res: Response) => {
//   const queries: Record<string, string> = {
//     inbound_records: 'SELECT * FROM inbound_records ORDER BY id DESC',
//     outbound_records: 'SELECT * FROM outbound_records ORDER BY id DESC',
//     partners: 'SELECT * FROM partners ORDER BY short_name',
//     product_prices: 'SELECT * FROM product_prices ORDER BY effective_date DESC',
//   };

//   const results: Record<string, any> = {};
//   const tableNames = Object.keys(queries);
//   let completed = 0;

//   tableNames.forEach((tableName) => {
//     const sql = queries[tableName]!;
//     db.all(sql, [], (err, rows) => {
//       if (err) {
//         console.error(`Error querying ${tableName}:`, err);
//         results[tableName] = { error: err.message };
//       } else {
//         results[tableName] = rows;
//       }

//       completed++;
//       if (completed === tableNames.length) {
//         res.json(results);
//       }
//     });
//   });
// });

// Get top 10 products by sales amount and "Others" total (read from overview-stats.json)
router.get('/top-sales-products', (_req: Request, res: Response) => {
  const statsFile = resolveFilesInDataPath("overview-stats.json");
  if (fs.existsSync(statsFile)) {
    try {
      const json = fs.readFileSync(statsFile, 'utf-8');
      const stats: StatsCache = JSON.parse(json);
      if (Array.isArray(stats.top_sales_products)) {
        return res.json({ success: true, data: stats.top_sales_products });
      }
    } catch (e) {
      // Reading failed
    }
  }
  return res.status(503).json({ error: 'Statistics data not generated, please refresh first.' });
});

// Get monthly inventory change for specified product (read from overview-stats.json)
router.get('/monthly-inventory-change/:productModel', (req: Request, res: Response) => {
  const productModel = req.params['productModel'] as string;

  if (!productModel) {
    return res.status(400).json({
      success: false,
      message: 'Product model cannot be empty',
    });
  }

  const statsFile = resolveFilesInDataPath("overview-stats.json");
  if (fs.existsSync(statsFile)) {
    try {
      const json = fs.readFileSync(statsFile, 'utf-8');
      const stats: StatsCache = JSON.parse(json);

      // Find monthly inventory change data for specified product from cache
      if (stats.monthly_inventory_changes && stats.monthly_inventory_changes[productModel]) {
        return res.json({
          success: true,
          data: stats.monthly_inventory_changes[productModel],
        });
      } else {
        return res.json({
          success: false,
          message: 'Monthly inventory change data not found for this product, please refresh statistics first',
        });
      }
    } catch (e) {
      // Reading failed
    }
  }

  return res.status(503).json({
    success: false,
    error: 'Statistics data not generated, please refresh first.',
  });
});

export default router;
