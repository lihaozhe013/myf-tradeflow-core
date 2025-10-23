/**
 * 库存缓存服务
 * 从数据库计算库存并提供缓存管理功能
 */
import db from '@/db.js';
import fs from 'fs';
import path from 'path';
import { logger } from '@/utils/logger.js';
import decimalCalc from '@/utils/decimalCalculator.js';
import type Decimal from 'decimal.js';
import {resolveFilesInDataPath} from '@/utils/paths';

const STOCK_CACHE_FILE = resolveFilesInDataPath('stock-summary.json');

/**
 * 产品库存数据接口
 */
interface ProductStockData {
  current_stock: number;
  last_inbound: string | null;
  last_outbound: string | null;
}

/**
 * 库存映射 - 用于计算过程
 */
interface StockMapItem {
  inbound: number;
  outbound: number;
}

/**
 * 完整的库存缓存数据结构
 */
interface StockCacheData {
  last_updated: string;
  products: Record<string, ProductStockData>;
  total_cost_estimate?: number;
}

/**
 * 库存明细返回格式
 */
interface StockSummaryItem {
  product_model: string;
  current_stock: number;
  last_inbound: string | null;
  last_outbound: string | null;
  last_update: string;
}

/**
 * 分页信息
 */
interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * 数据库查询结果类型
 */
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

/**
 * 回调函数类型定义
 */
type ErrorCallback<T> = (err: Error | null, result?: T) => void;

/**
 * 计算总成本估算
 * @param stockData 库存数据
 * @param callback 回调函数
 */
function calculateTotalCostEstimate(
  stockData: StockCacheData,
  callback: ErrorCallback<number>
): void {
  // 获取所有有库存的产品
  const productsWithStock = Object.entries(stockData.products).filter(
    ([_model, data]) => data.current_stock > 0
  );
  
  if (productsWithStock.length === 0) {
    return callback(null, 0);
  }
  
  let totalCost: Decimal = decimalCalc.decimal(0);
  let completedQueries = 0;
  
  productsWithStock.forEach(([productModel, productData]) => {
    // 获取该产品最新的单价（从入库记录中取最新的单价）
    db.get<UnitPriceRow>(
      'SELECT unit_price FROM inbound_records WHERE product_model = ? ORDER BY inbound_date DESC, id DESC LIMIT 1',
      [productModel],
      (err, row) => {
        if (!err && row && row.unit_price) {
          // 计算该产品的库存成本：库存数量 * 最新单价
          const productCost = decimalCalc.multiply(productData.current_stock, row.unit_price);
          totalCost = decimalCalc.add(totalCost, productCost);
        }
        
        completedQueries++;
        if (completedQueries === productsWithStock.length) {
          // 转换为数字格式返回
          callback(null, decimalCalc.toNumber(totalCost, 2));
        }
      }
    );
  });
}

/**
 * 从入库/出库记录计算每个产品的当前库存
 * @param callback 回调函数
 */
function calculateStockFromRecords(callback: ErrorCallback<StockCacheData>): void {
  const stockMap: Record<string, StockMapItem> = {};
  let completed = 0;
  const totalQueries = 2;

  // 处理入库记录
  db.all<InboundRow>(
    'SELECT product_model, SUM(quantity) as total_inbound FROM inbound_records GROUP BY product_model',
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

  // 处理出库记录
  db.all<OutboundRow>(
    'SELECT product_model, SUM(quantity) as total_outbound FROM outbound_records GROUP BY product_model',
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
    // 获取最后入库和出库日期
    let productQueries = 0;
    const productList = Object.keys(stockMap);
    
    if (productList.length === 0) {
      // 没有库存数据
      return callback(null, {
        last_updated: new Date().toISOString(),
        products: {},
        total_cost_estimate: 0
      });
    }

    const finalProductsMap: Record<string, ProductStockData> = {};

    productList.forEach((productModel) => {
      let productCompleted = 0;
      const stockItem = stockMap[productModel]!;
      const productData: ProductStockData = {
        current_stock: stockItem.inbound - stockItem.outbound,
        last_inbound: null,
        last_outbound: null
      };

      // 获取最后入库日期
      db.get<DateRow>(
        'SELECT MAX(inbound_date) as last_inbound FROM inbound_records WHERE product_model = ?',
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

      // 获取最后出库日期
      db.get<DateRow>(
        'SELECT MAX(outbound_date) as last_outbound FROM outbound_records WHERE product_model = ?',
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
      // 在所有库存计算完成后，计算总成本估算
      const finalStockData: StockCacheData = {
        last_updated: new Date().toISOString(),
        products: finalProductsMap
      };
      
      calculateTotalCostEstimate(finalStockData, (costErr, totalCostEstimate) => {
        if (costErr) {
          logger.error('计算总成本估算失败', { error: costErr.message });
          finalStockData.total_cost_estimate = 0;
        } else {
          finalStockData.total_cost_estimate = totalCostEstimate;
        }
        
        callback(null, finalStockData);
      });
    }
  }
}

/**
 * 刷新库存缓存
 * @param callback 回调函数
 */
function refreshStockCache(callback: ErrorCallback<StockCacheData>): void {
  calculateStockFromRecords((err, stockData) => {
    if (err) return callback(err);
    
    try {
      // 确保data目录存在
      const dataDir = path.dirname(STOCK_CACHE_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // 写入缓存文件
      fs.writeFileSync(STOCK_CACHE_FILE, JSON.stringify(stockData, null, 2));
      callback(null, stockData);
    } catch (writeErr) {
      callback(writeErr as Error);
    }
  });
}

/**
 * 读取库存缓存
 * @param callback 回调函数
 */
function getStockCache(callback: ErrorCallback<StockCacheData>): void {
  try {
    if (!fs.existsSync(STOCK_CACHE_FILE)) {
      logger.warn('库存缓存不存在，尝试刷新缓存');
      return refreshStockCache((refreshErr) => {
        if (refreshErr) {
          logger.error('刷新库存缓存失败', { error: refreshErr.message });
          return callback(new Error('库存缓存不存在且刷新失败，请检查系统设置'));
        }
        getStockCache(callback); // 递归调用以获取刷新后的缓存
      });
    }

    const data = fs.readFileSync(STOCK_CACHE_FILE, 'utf8');
    const stockData = JSON.parse(data) as StockCacheData;
    callback(null, stockData);
  } catch (err) {
    const error = err as Error;
    logger.error('读取库存缓存失败', { error: error.message });
    callback(error);
  }
}

/**
 * 获取库存明细（支持分页和筛选）
 * @param productModel 产品型号（可选）
 * @param page 页码
 * @param limit 每页数量
 * @param callback 回调函数
 */
function getStockSummary(
  productModel: string | null,
  page: number = 1,
  limit: number = 10,
  callback: ErrorCallback<{ data: StockSummaryItem[]; pagination: PaginationInfo }>
): void {
  getStockCache((err, stockData) => {
    if (err) return callback(err);
    
    let products = Object.entries(stockData!.products);
    
    // 筛选产品
    if (productModel) {
      products = products.filter(([model]) => 
        model.toLowerCase().includes(productModel.toLowerCase())
      );
    }
    
    // 分页
    const total = products.length;
    const offset = (page - 1) * limit;
    const pagedProducts = products.slice(offset, offset + limit);
    
    // 转换格式
    const result: StockSummaryItem[] = pagedProducts.map(([product_model, data]) => ({
      product_model,
      current_stock: data.current_stock,
      last_inbound: data.last_inbound,
      last_outbound: data.last_outbound,
      last_update: stockData!.last_updated
    }));
    
    callback(null, {
      data: result,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  });
}

/**
 * 获取库存总数
 * @param productModel 产品型号（可选）
 * @param callback 回调函数
 */
function getStockSummaryCount(
  productModel: string | null,
  callback: ErrorCallback<{ total: number }>
): void {
  getStockCache((err, stockData) => {
    if (err) return callback(err);
    
    let products = Object.keys(stockData!.products);
    
    if (productModel) {
      products = products.filter((model) => 
        model.toLowerCase().includes(productModel.toLowerCase())
      );
    }
    
    callback(null, { total: products.length });
  });
}

/**
 * 获取所有产品的库存数据（用于overview统计）
 * @param callback 回调函数
 */
function getAllStockData(callback: ErrorCallback<Record<string, ProductStockData>>): void {
  getStockCache((err, stockData) => {
    if (err) {
      logger.error('获取库存数据失败', { error: err.message });
      return callback(err);
    }
    callback(null, stockData!.products);
  });
}

export {
  refreshStockCache,
  getStockCache,
  getStockSummary,
  getStockSummaryCount,
  getAllStockData
};
