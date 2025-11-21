/**
 * Inventory Cache Service
 * Calculate inventory from the database and cache management
 */
import db from "@/db.js";
import fs from "fs";
import path from "path";
import { logger } from "@/utils/logger.js";
import decimalCalc from "@/utils/decimalCalculator.js";
import type Decimal from "decimal.js";
import { resolveFilesInDataPath } from "@/utils/paths";

const INVENTORY_CACHE_FILE = resolveFilesInDataPath("inventory-summary.json");

interface ProductInventoryData {
  current_inventory: number;
  last_inbound: string | null;
  last_outbound: string | null;
}

interface InventoryMapItem {
  inbound: number;
  outbound: number;
}

interface InventoryCacheData {
  last_updated: string;
  products: Record<string, ProductInventoryData>;
  total_cost_estimate?: number;
}

interface InventorySummaryItem {
  product_model: string;
  current_inventory: number;
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
 * @param inventoryData
 */
function calculateTotalCostEstimate(
  inventoryData: InventoryCacheData
): number {
  // Get all products with available inventory
  const productsWithInventory = Object.entries(inventoryData.products).filter(
    ([_model, data]) => data.current_inventory > 0
  );

  if (productsWithInventory.length === 0) {
    return 0;
  }

  let totalCost: Decimal = decimalCalc.decimal(0);

  productsWithInventory.forEach(([productModel, productData]) => {
    // Retrieve the latest unit price for this product (using the most recent unit price from the inventory records)
    // Use this unit price to better estimate the latest revenue
    const row = db.prepare(
      "SELECT unit_price FROM inbound_records WHERE product_model = ? ORDER BY inbound_date DESC, id DESC LIMIT 1"
    ).get(productModel) as UnitPriceRow | undefined;

    if (row && row.unit_price) {
      const productCost = decimalCalc.multiply(
        productData.current_inventory,
        row.unit_price
      );
      totalCost = decimalCalc.add(totalCost, productCost);
    }
  });

  return decimalCalc.toNumber(totalCost, 2);
}

/**
 * @returns InventoryCacheData
 */
function calculateInventoryFromRecords(): InventoryCacheData {
  const inventoryMap: Record<string, InventoryMapItem> = {};

  // Get inbound totals
  const inboundRows = db.prepare(
    "SELECT product_model, SUM(quantity) as total_inbound FROM inbound_records GROUP BY product_model"
  ).all() as InboundRow[];

  inboundRows.forEach((row) => {
    if (!inventoryMap[row.product_model]) {
      inventoryMap[row.product_model] = { inbound: 0, outbound: 0 };
    }
    inventoryMap[row.product_model]!.inbound = row.total_inbound || 0;
  });

  // Get outbound totals
  const outboundRows = db.prepare(
    "SELECT product_model, SUM(quantity) as total_outbound FROM outbound_records GROUP BY product_model"
  ).all() as OutboundRow[];

  outboundRows.forEach((row) => {
    if (!inventoryMap[row.product_model]) {
      inventoryMap[row.product_model] = { inbound: 0, outbound: 0 };
    }
    inventoryMap[row.product_model]!.outbound = row.total_outbound || 0;
  });

  const productList = Object.keys(inventoryMap);

  if (productList.length === 0) {
    // No inventory data
    return {
      last_updated: new Date().toISOString(),
      products: {},
      total_cost_estimate: 0,
    };
  }

  const finalProductsMap: Record<string, ProductInventoryData> = {};

  // Get last inbound and outbound dates for each product
  productList.forEach((productModel) => {
    const inventoryItem = inventoryMap[productModel]!;
    
    const lastInboundRow = db.prepare(
      "SELECT MAX(inbound_date) as last_inbound FROM inbound_records WHERE product_model = ?"
    ).get(productModel) as DateRow | undefined;

    const lastOutboundRow = db.prepare(
      "SELECT MAX(outbound_date) as last_outbound FROM outbound_records WHERE product_model = ?"
    ).get(productModel) as DateRow | undefined;

    finalProductsMap[productModel] = {
      current_inventory: inventoryItem.inbound - inventoryItem.outbound,
      last_inbound: lastInboundRow?.last_inbound || null,
      last_outbound: lastOutboundRow?.last_outbound || null,
    };
  });

  // Calculate Total Cost Estimate
  const finalInventoryData: InventoryCacheData = {
    last_updated: new Date().toISOString(),
    products: finalProductsMap,
  };

  const totalCostEstimate = calculateTotalCostEstimate(finalInventoryData);
  finalInventoryData.total_cost_estimate = totalCostEstimate;

  return finalInventoryData;
}

/**
 * @param callback
 */
function refreshInventoryCache(callback: ErrorCallback<InventoryCacheData>): void {
  try {
    const inventoryData = calculateInventoryFromRecords();

    // ensure data dir exist
    const dataDir = path.dirname(INVENTORY_CACHE_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // write cache to file
    fs.writeFileSync(INVENTORY_CACHE_FILE, JSON.stringify(inventoryData, null, 2));
    callback(null, inventoryData);
  } catch (err) {
    callback(err as Error);
  }
}

/**
 * @param callback
 */
function getInventoryCache(callback: ErrorCallback<InventoryCacheData>): void {
  try {
    if (!fs.existsSync(INVENTORY_CACHE_FILE)) {
      logger.warn("The cache do not exist, attempting to refresh the cache");
      return refreshInventoryCache((refreshErr) => {
        if (refreshErr) {
          logger.error("refresh (cache) failed", { error: refreshErr.message });
          return callback(
            new Error("Inventory cache does not exist and refresh failed!")
          );
        }
        getInventoryCache(callback);
      });
    }

    const data = fs.readFileSync(INVENTORY_CACHE_FILE, "utf8");
    const inventoryData = JSON.parse(data) as InventoryCacheData;
    callback(null, inventoryData);
  } catch (err) {
    const error = err as Error;
    logger.error("Failed to read inventory cache", { error: error.message });
    callback(error);
  }
}

/**
 * @param productModel
 * @param page
 * @param limit
 * @param callback
 */
function getInventorySummary(
  productModel: string | null,
  page: number = 1,
  limit: number = 10,
  callback: ErrorCallback<{
    data: InventorySummaryItem[];
    pagination: PaginationInfo;
  }>
): void {
  getInventoryCache((err, inventoryData) => {
    if (err) return callback(err);

    let products = Object.entries(inventoryData!.products);

    if (productModel) {
      products = products.filter(([model]) =>
        model.toLowerCase().includes(productModel.toLowerCase())
      );
    }

    const total = products.length;
    const offset = (page - 1) * limit;
    const pagedProducts = products.slice(offset, offset + limit);

    const result: InventorySummaryItem[] = pagedProducts.map(
      ([product_model, data]) => ({
        product_model,
        current_inventory: data.current_inventory,
        last_inbound: data.last_inbound,
        last_outbound: data.last_outbound,
        last_update: inventoryData!.last_updated,
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
function getAllInventoryData(
  callback: ErrorCallback<Record<string, ProductInventoryData>>
): void {
  getInventoryCache((err, inventoryData) => {
    if (err) {
      logger.error("Failed to retrieve inventory data", { error: err.message });
      return callback(err);
    }
    callback(null, inventoryData!.products);
  });
}

export { refreshInventoryCache, getInventoryCache, getInventorySummary, getAllInventoryData };
