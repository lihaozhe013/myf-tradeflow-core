const express = require('express');
const router = express.Router();
const db = require('../db');
const fs = require('fs');
const path = require('path');
const decimalCalc = require('../utils/decimalCalculator');

/**
 * 计算指定条件下已售商品的真实成本（加权平均成本法）
 * @param {string} startDate 开始日期
 * @param {string} endDate 结束日期
 * @param {string} customerCode 客户代号（可选）
 * @param {string} productModel 产品型号（可选）
 * @param {Function} callback 回调函数 (err, totalCost)
 */
function calculateFilteredSoldGoodsCost(startDate, endDate, customerCode, productModel, callback) {
  // 1. 构建查询条件
  let whereConditions = ['unit_price >= 0'];
  let params = [];
  
  if (customerCode && customerCode !== 'ALL') {
    whereConditions.push('customer_code = ?');
    params.push(customerCode);
  }
  
  if (productModel && productModel !== 'ALL') {
    whereConditions.push('product_model = ?');
    params.push(productModel);
  }
  
  // 添加时间区间条件
  whereConditions.push('date(outbound_date) BETWEEN ? AND ?');
  params.push(startDate, endDate);
  
  // 2. 计算每个产品的加权平均入库价格（全时间范围，只计算正数单价）
  db.all(`
    SELECT 
      product_model,
      SUM(quantity * unit_price) / SUM(quantity) as avg_cost_price,
      SUM(quantity) as total_inbound_quantity
    FROM inbound_records 
    WHERE unit_price >= 0
    GROUP BY product_model
  `, [], (err, avgCostData) => {
    if (err) return callback(err);
    
    // 转换为Map便于查找，使用 decimal.js 处理数据
    const avgCostMap = {};
    avgCostData.forEach(item => {
      avgCostMap[item.product_model] = {
        avg_cost_price: decimalCalc.fromSqlResult(item.avg_cost_price, 0, 4),
        total_inbound_quantity: decimalCalc.fromSqlResult(item.total_inbound_quantity, 0, 0)
      };
    });

    // 3. 获取指定条件的出库记录
    const outboundSql = `
      SELECT product_model, quantity, unit_price as selling_price
      FROM outbound_records
      WHERE ${whereConditions.join(' AND ')}
    `;
    
    db.all(outboundSql, params, (err, outboundRecords) => {
      if (err) return callback(err);
      
      if (outboundRecords.length === 0) {
        return callback(null, 0);
      }

      let totalSoldGoodsCost = decimalCalc.decimal(0);
      
      // 4. 使用平均成本计算每个销售记录的成本
      outboundRecords.forEach(outRecord => {
        const prodModel = outRecord.product_model;
        const soldQuantity = decimalCalc.decimal(outRecord.quantity);
        
        if (avgCostMap[prodModel]) {
          const avgCost = avgCostMap[prodModel].avg_cost_price;
          const recordCost = decimalCalc.multiply(soldQuantity, avgCost);
          totalSoldGoodsCost = decimalCalc.add(totalSoldGoodsCost, recordCost);
        } else {
          // 如果没有入库记录，使用出库价格作为成本（保守估计）
          const sellingPrice = decimalCalc.fromSqlResult(outRecord.selling_price, 0, 4);
          const recordCost = decimalCalc.multiply(soldQuantity, sellingPrice);
          totalSoldGoodsCost = decimalCalc.add(totalSoldGoodsCost, recordCost);
        }
      });

      // 5. 计算指定条件下入库负数单价商品的特殊收入，减少总成本
      let specialIncomeConditions = ['unit_price < 0'];
      let specialIncomeParams = [];
      
      if (productModel && productModel !== 'ALL') {
        specialIncomeConditions.push('product_model = ?');
        specialIncomeParams.push(productModel);
      }
      
      // 特殊收入也按时间区间计算
      specialIncomeConditions.push('date(inbound_date) BETWEEN ? AND ?');
      specialIncomeParams.push(startDate, endDate);
      
      const specialIncomeSql = `
        SELECT COALESCE(SUM(ABS(quantity * unit_price)), 0) as special_income
        FROM inbound_records 
        WHERE ${specialIncomeConditions.join(' AND ')}
      `;
      
      db.get(specialIncomeSql, specialIncomeParams, (err2, specialIncomeRow) => {
        if (err2) return callback(err2);
        
        const specialIncome = decimalCalc.fromSqlResult(specialIncomeRow.special_income, 0, 2);
        const finalCost = decimalCalc.subtract(totalSoldGoodsCost, specialIncome);
        
        // 确保成本不为负数并保留两位小数
        const result = decimalCalc.toDbNumber(decimalCalc.decimal(Math.max(0, finalCost.toNumber())), 2);
        callback(null, result);
      });
    });
  });
}

/**
 * 生成缓存键
 */
function generateCacheKey(startDate, endDate, customerCode, productModel) {
  const customer = customerCode || 'ALL';
  const product = productModel || 'ALL';
  return `${startDate}_${endDate}_${customer}_${product}`;
}

/**
 * 获取分析数据缓存文件路径
 */
function getCacheFilePath() {
  return path.resolve(__dirname, '../../data/analysis-cache.json');
}

/**
 * 清理过期缓存（保留最近30天的缓存）
 */
function cleanExpiredCache(cacheData) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const cleanedData = {};
  let cleanedCount = 0;
  
  Object.entries(cacheData).forEach(([key, data]) => {
    if (data.last_updated) {
      const lastUpdated = new Date(data.last_updated);
      // 保留30天内的缓存
      if (lastUpdated >= thirtyDaysAgo) {
        cleanedData[key] = data;
      } else {
        cleanedCount++;
      }
    } else {
      // 没有更新时间的数据也保留（兼容性）
      cleanedData[key] = data;
    }
  });
  
  if (cleanedCount > 0) {
    console.log(`清理了 ${cleanedCount} 个过期的分析缓存`);
  }
  
  return cleanedData;
}

/**
 * 读取缓存数据
 */
function readCache() {
  const cacheFile = getCacheFilePath();
  if (fs.existsSync(cacheFile)) {
    try {
      const json = fs.readFileSync(cacheFile, 'utf-8');
      const cacheData = JSON.parse(json);
      // 读取时自动清理过期缓存
      return cleanExpiredCache(cacheData);
    } catch (e) {
      console.error('读取分析缓存失败:', e);
      return {};
    }
  }
  return {};
}

/**
 * 写入缓存数据
 */
function writeCache(cacheData) {
  const cacheFile = getCacheFilePath();
  try {
    // 写入前先清理过期缓存
    const cleanedData = cleanExpiredCache(cacheData);
    fs.writeFileSync(cacheFile, JSON.stringify(cleanedData, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('写入分析缓存失败:', e);
    return false;
  }
}

// GET /api/analysis/data - 获取分析数据（从缓存读取）
router.get('/data', (req, res) => {
  const { start_date, end_date, customer_code, product_model } = req.query;
  
  // 参数校验
  if (!start_date || !end_date) {
    return res.status(400).json({
      success: false,
      message: '开始日期和结束日期不能为空'
    });
  }
  
  // 生成缓存键
  const cacheKey = generateCacheKey(start_date, end_date, customer_code, product_model);
  
  // 读取缓存
  const cache = readCache();
  
  if (cache[cacheKey]) {
    return res.json({
      success: true,
      data: cache[cacheKey]
    });
  }
  
  // 缓存不存在
  return res.status(503).json({
    success: false,
    error: '分析数据未生成，请先点击刷新按钮计算数据。'
  });
});

// POST /api/analysis/refresh - 刷新分析数据（重新计算并写入缓存）
router.post('/refresh', (req, res) => {
  const { start_date, end_date, customer_code, product_model } = req.body;
  
  // 参数校验
  if (!start_date || !end_date) {
    return res.status(400).json({
      success: false,
      message: '开始日期和结束日期不能为空'
    });
  }
  
  // 日期格式校验
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
    return res.status(400).json({
      success: false,
      message: '日期格式错误，请使用 YYYY-MM-DD 格式'
    });
  }
  
  // 检查日期区间合理性
  if (new Date(start_date) > new Date(end_date)) {
    return res.status(400).json({
      success: false,
      message: '开始日期不能晚于结束日期'
    });
  }
  
  // 1. 计算销售额
  let salesSqlConditions = ['unit_price >= 0', 'date(outbound_date) BETWEEN ? AND ?'];
  let salesParams = [start_date, end_date];
  
  if (customer_code && customer_code !== 'ALL') {
    salesSqlConditions.push('customer_code = ?');
    salesParams.push(customer_code);
  }
  
  if (product_model && product_model !== 'ALL') {
    salesSqlConditions.push('product_model = ?');
    salesParams.push(product_model);
  }
  
  const salesSql = `
    SELECT 
      COALESCE(SUM(quantity * unit_price), 0) as normal_sales,
      COALESCE((
        SELECT SUM(ABS(quantity * unit_price)) 
        FROM outbound_records 
        WHERE unit_price < 0 
          AND date(outbound_date) BETWEEN ? AND ?
          ${customer_code && customer_code !== 'ALL' ? 'AND customer_code = ?' : ''}
          ${product_model && product_model !== 'ALL' ? 'AND product_model = ?' : ''}
      ), 0) as special_expense
    FROM outbound_records 
    WHERE ${salesSqlConditions.join(' AND ')}
  `;
  
  // 构建特殊支出查询的参数
  let specialExpenseParams = [start_date, end_date];
  if (customer_code && customer_code !== 'ALL') {
    specialExpenseParams.push(customer_code);
  }
  if (product_model && product_model !== 'ALL') {
    specialExpenseParams.push(product_model);
  }
  
  const finalSalesParams = [...salesParams, ...specialExpenseParams];
  
  db.get(salesSql, finalSalesParams, (err, salesRow) => {
    if (err) {
      console.error('计算销售额失败:', err);
      return res.status(500).json({
        success: false,
        message: '计算销售额失败'
      });
    }
    
    // 2. 计算成本
    calculateFilteredSoldGoodsCost(start_date, end_date, customer_code, product_model, (costErr, costAmount) => {
      if (costErr) {
        console.error('计算成本失败:', costErr);
        return res.status(500).json({
          success: false,
          message: '计算成本失败'
        });
      }
      
      // 3. 使用 decimal.js 精确计算结果
      const normalSales = decimalCalc.fromSqlResult(salesRow.normal_sales, 0, 2);
      const specialExpense = decimalCalc.fromSqlResult(salesRow.special_expense, 0, 2);
      const salesAmount = decimalCalc.toDbNumber(decimalCalc.subtract(normalSales, specialExpense), 2);
      const cost = decimalCalc.toDbNumber(costAmount, 2);
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
          customer_code: customer_code || 'ALL',
          product_model: product_model || 'ALL'
        },
        last_updated: new Date().toISOString()
      };
      
      // 5. 写入缓存
      const cacheKey = generateCacheKey(start_date, end_date, customer_code, product_model);
      const cache = readCache();
      cache[cacheKey] = resultData;
      
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
    });
  });
});

// GET /api/analysis/filter-options - 获取筛选选项
router.get('/filter-options', (req, res) => {
  // 查询所有客户
  const customerSql = `
    SELECT code, short_name, full_name 
    FROM partners 
    WHERE type = 1 
    ORDER BY short_name
  `;
  
  // 查询所有产品
  const productSql = `
    SELECT code, product_model 
    FROM products 
    ORDER BY product_model
  `;
  
  db.all(customerSql, [], (err1, customers) => {
    if (err1) {
      console.error('查询客户列表失败:', err1);
      return res.status(500).json({
        success: false,
        message: '查询客户列表失败'
      });
    }
    
    db.all(productSql, [], (err2, products) => {
      if (err2) {
        console.error('查询产品列表失败:', err2);
        return res.status(500).json({
          success: false,
          message: '查询产品列表失败'
        });
      }
      
      // 组装筛选选项
      const customerOptions = [
        { code: 'ALL', name: 'All' },
        ...customers.map(c => ({
          code: c.code,
          name: `${c.short_name} (${c.full_name})`
        }))
      ];
      
      const productOptions = [
        { model: 'ALL', name: 'All' },
        ...products.map(p => ({
          model: p.product_model,
          name: p.product_model
        }))
      ];
      
      res.json({
        success: true,
        customers: customerOptions,
        products: productOptions
      });
    });
  });
});

// POST /api/analysis/clean-cache - 手动清理过期缓存
router.post('/clean-cache', (req, res) => {
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

module.exports = router;
