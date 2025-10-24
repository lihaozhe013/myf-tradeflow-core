/**
 * Stock Cache Service
 * Calculate inventory from the database and cache management
 */
import db from "@/db.js";
import fs from "fs";
import path from "path";
import { logger } from "@/utils/logger.js";
import decimalCalc from "@/utils/decimalCalculator.js";
import type Decimal from "decimal.js";
import { resolveFilesInDataPath } from "@/utils/paths";

const STOCK_CACHE_FILE = resolveFilesInDataPath("stock-summary.json");

interface ProductStockData {
  current_stock: number;
  last_inbound: string | null;
  last_outbound: string | null;
}

interface StockMapItem {
  inbound: number;
  outbound: number;
}

interface StockCacheData {
  last_updated: string;
  products: Record<string, ProductStockData>;
  total_cost_estimate?: number;
}

interface StockSummaryItem {
  product_model: string;
  current_stock: number;
  last_inbound: string | null;
  last_outbound: string | null;
  last_update: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface InboundRow {
  product_model: string;
  total_inbound: number;
}

interface OutboundRow {
  product_model: string;
  total_outbound: number;
}

interface UnitPriceRow {
  unit_price: number;
}

interface DateRow {
  last_inbound?: string | null;
  last_outbound?: string | null;
}

type ErrorCallback<T> = (err: Error | null, result?: T) => void;

/**
 * @param stockData
 * @param callback
 */
function calculateTotalCostEstimate(
  stockData: StockCacheData,
  callback: ErrorCallback<number>
): void {
  // Get all products with available inventory
  const productsWithStock = Object.entries(stockData.products).filter(
    ([_model, data]) => data.current_stock > 0
  );

  if (productsWithStock.length === 0) {
    return callback(null, 0);
  }

  let totalCost: Decimal = decimalCalc.decimal(0);
  let completedQueries = 0;

  productsWithStock.forEach(([productModel, productData]) => {
    // Retrieve the latest unit price for this product (using the most recent unit price from the inventory records)
    // Use this unit price to better estimate the latest revenue
    db.get<UnitPriceRow>(
      "SELECT unit_price FROM inbound_records WHERE product_model = ? ORDER BY inbound_date DESC, id DESC LIMIT 1",
      [productModel],
      (err, row) => {
        if (!err && row && row.unit_price) {
          const productCost = decimalCalc.multiply(
            productData.current_stock,
            row.unit_price
          );
          totalCost = decimalCalc.add(totalCost, productCost);
        }

        completedQueries++;
        if (completedQueries === productsWithStock.length) {
          callback(null, decimalCalc.toNumber(totalCost, 2));
        }
      }
    );
  });
}

/**
 * @param callback
 */
function calculateStockFromRecords(
  callback: ErrorCallback<StockCacheData>
): void {
  const stockMap: Record<string, StockMapItem> = {};
  let completed = 0;
  const totalQueries = 2;

  db.all<InboundRow>(
    "SELECT product_model, SUM(quantity) as total_inbound FROM inbound_records GROUP BY product_model",
    [],
    (err, inboundRows) => {
      if (err) return callback(err);

      inboundRows.forEach((row) => {
        if (!stockMap[row.product_model]) {
          stockMap[row.product_model] = { inbound: 0, outbound: 0 };
        }
        stockMap[row.product_model]!.inbound = row.total_inbound || 0;
      });

      completed++;
      if (completed === totalQueries) {
        processStockData();
      }
    }
  );

  db.all<OutboundRow>(
    "SELECT product_model, SUM(quantity) as total_outbound FROM outbound_records GROUP BY product_model",
    [],
    (err, outboundRows) => {
      if (err) return callback(err);

      outboundRows.forEach((row) => {
        if (!stockMap[row.product_model]) {
          stockMap[row.product_model] = { inbound: 0, outbound: 0 };
        }
        stockMap[row.product_model]!.outbound = row.total_outbound || 0;
      });

      completed++;
      if (completed === totalQueries) {
        processStockData();
      }
    }
  );

  function processStockData(): void {
    // Retrieve the last date of inventory receipt and last date of inventory issuance
    let productQueries = 0;
    const productList = Object.keys(stockMap);

    if (productList.length === 0) {
      // No stock data
      return callback(null, {
        last_updated: new Date().toISOString(),
        products: {},
        total_cost_estimate: 0,
      });
    }

    const finalProductsMap: Record<string, ProductStockData> = {};

    productList.forEach((productModel) => {
      let productCompleted = 0;
      const stockItem = stockMap[productModel]!;
      const productData: ProductStockData = {
        current_stock: stockItem.inbound - stockItem.outbound,
        last_inbound: null,
        last_outbound: null,
      };

      // GEt latest inbound data
      db.get<DateRow>(
        "SELECT MAX(inbound_date) as last_inbound FROM inbound_records WHERE product_model = ?",
        [productModel],
        (err, row) => {
          if (!err && row && row.last_inbound) {
            productData.last_inbound = row.last_inbound;
          }
          productCompleted++;
          if (productCompleted === 2) {
            finalProductsMap[productModel] = productData;
            productQueries++;
            if (productQueries === productList.length) {
              finalizeCacheData();
            }
          }
        }
      );

      // Get latest outbound date
      db.get<DateRow>(
        "SELECT MAX(outbound_date) as last_outbound FROM outbound_records WHERE product_model = ?",
        [productModel],
        (err, row) => {
          if (!err && row && row.last_outbound) {
            productData.last_outbound = row.last_outbound;
          }
          productCompleted++;
          if (productCompleted === 2) {
            finalProductsMap[productModel] = productData;
            productQueries++;
            if (productQueries === productList.length) {
              finalizeCacheData();
            }
          }
        }
      );
    });

    function finalizeCacheData(): void {
      // Calculate Total Cost Estimate
      const finalStockData: StockCacheData = {
        last_updated: new Date().toISOString(),
        products: finalProductsMap,
      };

      calculateTotalCostEstimate(
        finalStockData,
        (costErr, totalCostEstimate) => {
          if (costErr) {
            logger.error("Calculate Total Cost Estimate Failed", { error: costErr.message });
            finalStockData.total_cost_estimate = 0;
          } else {
            finalStockData.total_cost_estimate = totalCostEstimate;
          }

          callback(null, finalStockData);
        }
      );
    }
  }
}

/**
 * @param callback
 */
function refreshStockCache(callback: ErrorCallback<StockCacheData>): void {
  calculateStockFromRecords((err, stockData) => {
    if (err) return callback(err);

    try {
      // ensure data dir exist
      const dataDir = path.dirname(STOCK_CACHE_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // write cache to file
      fs.writeFileSync(STOCK_CACHE_FILE, JSON.stringify(stockData, null, 2));
      callback(null, stockData);
    } catch (writeErr) {
      callback(writeErr as Error);
    }
  });
}

/**
 * @param callback
 */
function getStockCache(callback: ErrorCallback<StockCacheData>): void {
  try {
    if (!fs.existsSync(STOCK_CACHE_FILE)) {
      logger.warn("The cache do not exist, attempting to refresh the cache");
      return refreshStockCache((refreshErr) => {
        if (refreshErr) {
          logger.error("refresh (cache) failed", { error: refreshErr.message });
          return callback(
            new Error("Inventory cache does not exist and refresh failed!")
          );
        }
        getStockCache(callback);
      });
    }

    const data = fs.readFileSync(STOCK_CACHE_FILE, "utf8");
    const stockData = JSON.parse(data) as StockCacheData;
    callback(null, stockData);
  } catch (err) {
    const error = err as Error;
    logger.error("Failed to read stock cache", { error: error.message });
    callback(error);
  }
}

/**
 * @param productModel
 * @param page
 * @param limit
 * @param callback
 */
function getStockSummary(
  productModel: string | null,
  page: number = 1,
  limit: number = 10,
  callback: ErrorCallback<{
    data: StockSummaryItem[];
    pagination: PaginationInfo;
  }>
): void {
  getStockCache((err, stockData) => {
    if (err) return callback(err);

    let products = Object.entries(stockData!.products);

    if (productModel) {
      products = products.filter(([model]) =>
        model.toLowerCase().includes(productModel.toLowerCase())
      );
    }

    const total = products.length;
    const offset = (page - 1) * limit;
    const pagedProducts = products.slice(offset, offset + limit);

    const result: StockSummaryItem[] = pagedProducts.map(
      ([product_model, data]) => ({
        product_model,
        current_stock: data.current_stock,
        last_inbound: data.last_inbound,
        last_outbound: data.last_outbound,
        last_update: stockData!.last_updated,
      })
    );

    callback(null, {
      data: result,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  });
}

/**
 * @param callback
 */
function getAllStockData(
  callback: ErrorCallback<Record<string, ProductStockData>>
): void {
  getStockCache((err, stockData) => {
    if (err) {
      logger.error("Failed to retrieve inventory data", { error: err.message });
      return callback(err);
    }
    callback(null, stockData!.products);
  });
}

export { refreshStockCache, getStockCache, getStockSummary, getAllStockData };
