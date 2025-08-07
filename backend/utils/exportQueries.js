// 导出数据查询模块
const db = require('../db');
const decimalCalc = require('./decimalCalculator');

class ExportQueries {
  /**
   * 获取基础信息数据
   * @param {string} tables - 要导出的表格，如 '123'
   * @returns {Promise<Object>} 返回包含各表数据的对象
   */
  async getBaseInfoData(tables = '123') {
    const result = {};
    
    // 1: 客户供应商数据
    if (tables.includes('1')) {
      result.partners = await this.getPartnersData();
    }
    
    // 2: 产品数据
    if (tables.includes('2')) {
      result.products = await this.getProductsData();
    }
    
    // 3: 产品价格数据
    if (tables.includes('3')) {
      result.prices = await this.getPricesData();
    }
    
    return result;
  }

  /**
   * 获取入库出库数据
   * @param {Object} filters - 筛选条件
   * @returns {Promise<Object>} 返回包含入库出库数据的对象
   */
  async getInboundOutboundData(filters = {}) {
    const { tables = '12', dateFrom, dateTo, productCode, customerCode } = filters;
    const result = {};
    
    // 1: 入库记录
    if (tables.includes('1')) {
      result.inbound = await this.getInboundData({ dateFrom, dateTo, productCode, customerCode });
    }
    
    // 2: 出库记录
    if (tables.includes('2')) {
      result.outbound = await this.getOutboundData({ dateFrom, dateTo, productCode, customerCode });
    }
    
    return result;
  }

  /**
   * 获取应收应付数据
   * @param {Object} filters - 筛选条件
   * @returns {Promise<Object>} 返回包含应收应付数据的对象
   */
  async getReceivablePayableData(filters = {}) {
    const { outboundFrom, outboundTo, paymentFrom, paymentTo } = filters;
    
    const result = {
      receivable_summary: await this.getReceivableSummary({ outboundFrom, outboundTo, paymentFrom, paymentTo }),
      receivable_details: await this.getReceivableDetails({ outboundFrom, outboundTo }),
      receivable_payments: await this.getReceivablePayments({ paymentFrom, paymentTo }),
      payable_summary: await this.getPayableSummary({ outboundFrom, outboundTo, paymentFrom, paymentTo }),
      payable_details: await this.getPayableDetails({ outboundFrom, outboundTo }),
      payable_payments: await this.getPayablePayments({ paymentFrom, paymentTo })
    };
    
    return result;
  }

  // ========== 具体查询方法 ==========

  /**
   * 获取客户供应商数据
   */
  getPartnersData() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT code, short_name, full_name, 
               CASE WHEN type = 0 THEN '供应商' ELSE '客户' END as type_name,
               address, contact_person, contact_phone 
        FROM partners 
        ORDER BY short_name
      `;
      
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * 获取产品数据
   */
  getProductsData() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT code, category, product_model, remark 
        FROM products 
        ORDER BY category, product_model
      `;
      
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * 获取产品价格数据
   */
  getPricesData() {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT partner_short_name, product_model, effective_date, unit_price 
        FROM product_prices 
        ORDER BY partner_short_name, product_model, effective_date DESC
      `;
      
      db.all(sql, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * 获取入库数据
   */
  getInboundData(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT id, supplier_code, supplier_short_name, supplier_full_name,
               product_code, product_model, quantity, unit_price, total_price,
               inbound_date, invoice_date, invoice_number, order_number, remark
        FROM inbound_records 
        WHERE 1=1
      `;
      const params = [];
      
      if (filters.dateFrom) {
        sql += ' AND inbound_date >= ?';
        params.push(filters.dateFrom);
      }
      if (filters.dateTo) {
        sql += ' AND inbound_date <= ?';
        params.push(filters.dateTo);
      }
      if (filters.productCode) {
        sql += ' AND (product_code LIKE ? OR product_model LIKE ?)';
        params.push(`%${filters.productCode}%`, `%${filters.productCode}%`);
      }
      if (filters.customerCode) {
        sql += ' AND (supplier_code LIKE ? OR supplier_short_name LIKE ?)';
        params.push(`%${filters.customerCode}%`, `%${filters.customerCode}%`);
      }
      
      sql += ' ORDER BY inbound_date DESC, id DESC';
      
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * 获取出库数据
   */
  getOutboundData(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT id, customer_code, customer_short_name, customer_full_name,
               product_code, product_model, quantity, unit_price, total_price,
               outbound_date, invoice_date, invoice_number, order_number, remark
        FROM outbound_records 
        WHERE 1=1
      `;
      const params = [];
      
      if (filters.dateFrom) {
        sql += ' AND outbound_date >= ?';
        params.push(filters.dateFrom);
      }
      if (filters.dateTo) {
        sql += ' AND outbound_date <= ?';
        params.push(filters.dateTo);
      }
      if (filters.productCode) {
        sql += ' AND (product_code LIKE ? OR product_model LIKE ?)';
        params.push(`%${filters.productCode}%`, `%${filters.productCode}%`);
      }
      if (filters.customerCode) {
        sql += ' AND (customer_code LIKE ? OR customer_short_name LIKE ?)';
        params.push(`%${filters.customerCode}%`, `%${filters.customerCode}%`);
      }
      
      sql += ' ORDER BY outbound_date DESC, id DESC';
      
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * 获取应收账款汇总
   */
  getReceivableSummary(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          o.customer_code,
          o.customer_short_name,
          o.customer_full_name,
          COALESCE(SUM(o.total_price), 0) as total_sales,
          COALESCE(SUM(p.amount), 0) as total_payments,
          COALESCE(SUM(o.total_price), 0) - COALESCE(SUM(p.amount), 0) as balance
        FROM outbound_records o
        LEFT JOIN receivable_payments p ON o.customer_code = p.customer_code
      `;
      
      const conditions = ['1=1'];
      const params = [];
      
      if (filters.outboundFrom) {
        conditions.push('o.outbound_date >= ?');
        params.push(filters.outboundFrom);
      }
      if (filters.outboundTo) {
        conditions.push('o.outbound_date <= ?');
        params.push(filters.outboundTo);
      }
      if (filters.paymentFrom) {
        conditions.push('(p.pay_date IS NULL OR p.pay_date >= ?)');
        params.push(filters.paymentFrom);
      }
      if (filters.paymentTo) {
        conditions.push('(p.pay_date IS NULL OR p.pay_date <= ?)');
        params.push(filters.paymentTo);
      }
      
      sql += ' WHERE ' + conditions.join(' AND ');
      sql += ' GROUP BY o.customer_code, o.customer_short_name, o.customer_full_name';
      sql += ' ORDER BY balance DESC';
      
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // 使用 decimal.js 重新计算精确的余额
          const processedRows = (rows || []).map(row => {
            const totalSales = decimalCalc.fromSqlResult(row.total_sales, 0);
            const totalPayments = decimalCalc.fromSqlResult(row.total_payments, 0);
            const balance = decimalCalc.calculateBalance(totalSales, totalPayments);
            
            return {
              ...row,
              total_sales: totalSales,
              total_payments: totalPayments,
              balance: balance
            };
          });
          resolve(processedRows);
        }
      });
    });
  }

  /**
   * 获取应收明细
   */
  getReceivableDetails(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT id as record_id, customer_code, customer_short_name, 
               product_model, total_price, outbound_date, remark
        FROM outbound_records 
        WHERE 1=1
      `;
      const params = [];
      
      if (filters.outboundFrom) {
        sql += ' AND outbound_date >= ?';
        params.push(filters.outboundFrom);
      }
      if (filters.outboundTo) {
        sql += ' AND outbound_date <= ?';
        params.push(filters.outboundTo);
      }
      
      sql += ' ORDER BY outbound_date DESC, id DESC';
      
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * 获取回款记录
   */
  getReceivablePayments(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT id, customer_code, amount, pay_date, pay_method, remark
        FROM receivable_payments 
        WHERE 1=1
      `;
      const params = [];
      
      if (filters.paymentFrom) {
        sql += ' AND pay_date >= ?';
        params.push(filters.paymentFrom);
      }
      if (filters.paymentTo) {
        sql += ' AND pay_date <= ?';
        params.push(filters.paymentTo);
      }
      
      sql += ' ORDER BY pay_date DESC, id DESC';
      
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * 获取应付账款汇总
   */
  getPayableSummary(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          i.supplier_code,
          i.supplier_short_name,
          i.supplier_full_name,
          COALESCE(SUM(i.total_price), 0) as total_purchases,
          COALESCE(SUM(p.amount), 0) as total_payments,
          COALESCE(SUM(i.total_price), 0) - COALESCE(SUM(p.amount), 0) as balance
        FROM inbound_records i
        LEFT JOIN payable_payments p ON i.supplier_code = p.supplier_code
      `;
      
      const conditions = ['1=1'];
      const params = [];
      
      if (filters.outboundFrom) {
        conditions.push('i.inbound_date >= ?');
        params.push(filters.outboundFrom);
      }
      if (filters.outboundTo) {
        conditions.push('i.inbound_date <= ?');
        params.push(filters.outboundTo);
      }
      if (filters.paymentFrom) {
        conditions.push('(p.pay_date IS NULL OR p.pay_date >= ?)');
        params.push(filters.paymentFrom);
      }
      if (filters.paymentTo) {
        conditions.push('(p.pay_date IS NULL OR p.pay_date <= ?)');
        params.push(filters.paymentTo);
      }
      
      sql += ' WHERE ' + conditions.join(' AND ');
      sql += ' GROUP BY i.supplier_code, i.supplier_short_name, i.supplier_full_name';
      sql += ' ORDER BY balance DESC';
      
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // 使用 decimal.js 重新计算精确的余额
          const processedRows = (rows || []).map(row => {
            const totalPurchases = decimalCalc.fromSqlResult(row.total_purchases, 0);
            const totalPayments = decimalCalc.fromSqlResult(row.total_payments, 0);
            const balance = decimalCalc.calculateBalance(totalPurchases, totalPayments);
            
            return {
              ...row,
              total_purchases: totalPurchases,
              total_payments: totalPayments,
              balance: balance
            };
          });
          resolve(processedRows);
        }
      });
    });
  }

  /**
   * 获取应付明细
   */
  getPayableDetails(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT id as record_id, supplier_code, supplier_short_name, 
               product_model, total_price, inbound_date, remark
        FROM inbound_records 
        WHERE 1=1
      `;
      const params = [];
      
      if (filters.outboundFrom) {
        sql += ' AND inbound_date >= ?';
        params.push(filters.outboundFrom);
      }
      if (filters.outboundTo) {
        sql += ' AND inbound_date <= ?';
        params.push(filters.outboundTo);
      }
      
      sql += ' ORDER BY inbound_date DESC, id DESC';
      
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * 获取付款记录
   */
  getPayablePayments(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT id, supplier_code, amount, pay_date, pay_method, remark
        FROM payable_payments 
        WHERE 1=1
      `;
      const params = [];
      
      if (filters.paymentFrom) {
        sql += ' AND pay_date >= ?';
        params.push(filters.paymentFrom);
      }
      if (filters.paymentTo) {
        sql += ' AND pay_date <= ?';
        params.push(filters.paymentTo);
      }
      
      sql += ' ORDER BY pay_date DESC, id DESC';
      
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  /**
   * 获取发票数据（按产品合并，相同产品相同单价的记录进行数量和总金额合并）
   * @param {Object} filters - 筛选条件
   * @param {string} filters.partnerCode - 合作伙伴代号（必填）
   * @param {string} filters.dateFrom - 开始日期
   * @param {string} filters.dateTo - 结束日期
   * @returns {Promise<Array>} 返回发票数据数组
   */
  async getInvoiceData(filters = {}) {
    const { partnerCode, dateFrom, dateTo } = filters;
    
    if (!partnerCode) {
      throw new Error('合作伙伴代号是必填项');
    }

    return new Promise((resolve, reject) => {
      // 合并入库和出库记录，按产品型号和单价分组求和
      let sql = `
        SELECT 
          product_model,
          unit_price,
          SUM(quantity) as quantity,
          SUM(total_price) as total_price
        FROM (
          -- 入库记录
          SELECT 
            product_model,
            unit_price,
            quantity,
            total_price
          FROM inbound_records 
          WHERE (supplier_code = ? OR supplier_short_name = ?)
          ${dateFrom ? 'AND inbound_date >= ?' : ''}
          ${dateTo ? 'AND inbound_date <= ?' : ''}
          
          UNION ALL
          
          -- 出库记录
          SELECT 
            product_model,
            unit_price,
            quantity,
            total_price
          FROM outbound_records 
          WHERE (customer_code = ? OR customer_short_name = ?)
          ${dateFrom ? 'AND outbound_date >= ?' : ''}
          ${dateTo ? 'AND outbound_date <= ?' : ''}
        ) as combined_records
        GROUP BY product_model, unit_price
        ORDER BY product_model, unit_price
      `;
      
      const params = [partnerCode, partnerCode];
      if (dateFrom) params.push(dateFrom);
      if (dateTo) params.push(dateTo);
      params.push(partnerCode, partnerCode);
      if (dateFrom) params.push(dateFrom);
      if (dateTo) params.push(dateTo);
      
      db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * 获取按客户分类的分析数据（高级导出）
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<Array>} 返回客户分析数据数组
   */
  async getCustomerAnalysisData(startDate, endDate) {
    return new Promise((resolve, reject) => {
      // 首先获取所有客户的销售数据
      const customerSalesSql = `
        SELECT 
          p.code as customer_code,
          p.full_name as customer_name,
          o.product_model,
          SUM(o.quantity) as total_quantity,
          SUM(o.total_price) as sales_amount
        FROM outbound_records o
        LEFT JOIN partners p ON (o.customer_code = p.code OR o.customer_short_name = p.short_name)
        WHERE o.outbound_date >= ? AND o.outbound_date <= ?
        AND p.code IS NOT NULL
        AND o.unit_price >= 0
        GROUP BY p.code, p.full_name, o.product_model
        ORDER BY p.full_name, o.product_model
      `;

      db.all(customerSalesSql, [startDate, endDate], (err, salesData) => {
        if (err) return reject(err);

        if (salesData.length === 0) {
          return resolve([]);
        }

        // 获取所有产品的平均成本价格
        const avgCostSql = `
          SELECT 
            product_model,
            SUM(quantity * unit_price) / SUM(quantity) as avg_cost_price
          FROM inbound_records 
          WHERE unit_price >= 0
          GROUP BY product_model
        `;

        db.all(avgCostSql, [], (costErr, costData) => {
          if (costErr) return reject(costErr);

          // 转换为Map便于查找
          const costMap = {};
          costData.forEach(item => {
            costMap[item.product_model] = item.avg_cost_price || 0;
          });

          // 处理每个客户的数据
          const customerMap = {};
          
          salesData.forEach(row => {
            const customerCode = row.customer_code;
            const customerName = row.customer_name;
            const productModel = row.product_model;
            const salesAmount = row.sales_amount || 0;
            const quantity = row.total_quantity || 0;
            
            // 计算成本（使用平均成本价格 * 销售数量）
            const avgCostPrice = costMap[productModel] || 0;
            const costAmount = avgCostPrice * quantity;
            const profitAmount = salesAmount - costAmount;
            const profitRate = salesAmount > 0 ? (profitAmount / salesAmount) * 100 : 0;

            if (!customerMap[customerCode]) {
              customerMap[customerCode] = {
                customer_code: customerCode,
                customer_name: customerName,
                sales_amount: 0,
                cost_amount: 0,
                profit_amount: 0,
                profit_rate: 0,
                product_details: []
              };
            }

            // 累加客户总数据
            customerMap[customerCode].sales_amount += salesAmount;
            customerMap[customerCode].cost_amount += costAmount;
            customerMap[customerCode].profit_amount += profitAmount;

            // 添加产品明细
            customerMap[customerCode].product_details.push({
              product_model: productModel,
              sales_amount: salesAmount,
              cost_amount: costAmount,
              profit_amount: profitAmount,
              profit_rate: profitRate
            });
          });

          // 计算每个客户的总利润率
          Object.values(customerMap).forEach(customer => {
            customer.profit_rate = customer.sales_amount > 0 
              ? (customer.profit_amount / customer.sales_amount) * 100 
              : 0;
          });

          // 转换为数组并按销售额排序
          const result = Object.values(customerMap)
            .sort((a, b) => b.sales_amount - a.sales_amount);

          resolve(result);
        });
      });
    });
  }

  /**
   * 获取按产品分类的分析数据（高级导出）
   * @param {string} startDate - 开始日期
   * @param {string} endDate - 结束日期
   * @returns {Promise<Array>} 返回产品分析数据数组
   */
  async getProductAnalysisData(startDate, endDate) {
    return new Promise((resolve, reject) => {
      // 首先获取所有产品的销售数据
      const productSalesSql = `
        SELECT 
          o.product_model,
          p.code as customer_code,
          p.full_name as customer_name,
          SUM(o.quantity) as total_quantity,
          SUM(o.total_price) as sales_amount
        FROM outbound_records o
        LEFT JOIN partners p ON (o.customer_code = p.code OR o.customer_short_name = p.short_name)
        WHERE o.outbound_date >= ? AND o.outbound_date <= ?
        AND p.code IS NOT NULL
        AND o.unit_price >= 0
        GROUP BY o.product_model, p.code, p.full_name
        ORDER BY o.product_model, p.full_name
      `;

      db.all(productSalesSql, [startDate, endDate], (err, salesData) => {
        if (err) return reject(err);

        if (salesData.length === 0) {
          return resolve([]);
        }

        // 获取所有产品的平均成本价格
        const avgCostSql = `
          SELECT 
            product_model,
            SUM(quantity * unit_price) / SUM(quantity) as avg_cost_price
          FROM inbound_records 
          WHERE unit_price >= 0
          GROUP BY product_model
        `;

        db.all(avgCostSql, [], (costErr, costData) => {
          if (costErr) return reject(costErr);

          // 转换为Map便于查找
          const costMap = {};
          costData.forEach(item => {
            costMap[item.product_model] = item.avg_cost_price || 0;
          });

          // 处理每个产品的数据
          const productMap = {};
          
          salesData.forEach(row => {
            const productModel = row.product_model;
            const customerCode = row.customer_code;
            const customerName = row.customer_name;
            const salesAmount = row.sales_amount || 0;
            const quantity = row.total_quantity || 0;
            
            // 计算成本（使用平均成本价格 * 销售数量）
            const avgCostPrice = costMap[productModel] || 0;
            const costAmount = avgCostPrice * quantity;
            const profitAmount = salesAmount - costAmount;
            const profitRate = salesAmount > 0 ? (profitAmount / salesAmount) * 100 : 0;

            if (!productMap[productModel]) {
              productMap[productModel] = {
                product_model: productModel,
                sales_amount: 0,
                cost_amount: 0,
                profit_amount: 0,
                profit_rate: 0,
                customer_details: []
              };
            }

            // 累加产品总数据
            productMap[productModel].sales_amount += salesAmount;
            productMap[productModel].cost_amount += costAmount;
            productMap[productModel].profit_amount += profitAmount;

            // 添加客户明细
            productMap[productModel].customer_details.push({
              customer_code: customerCode,
              customer_name: customerName,
              sales_amount: salesAmount,
              cost_amount: costAmount,
              profit_amount: profitAmount,
              profit_rate: profitRate
            });
          });

          // 计算每个产品的总利润率
          Object.values(productMap).forEach(product => {
            product.profit_rate = product.sales_amount > 0 
              ? (product.profit_amount / product.sales_amount) * 100 
              : 0;
          });

          // 转换为数组并按销售额排序
          const result = Object.values(productMap)
            .filter(product => product.product_model && product.product_model.trim() !== '')
            .sort((a, b) => b.sales_amount - a.sales_amount);

          resolve(result);
        });
      });
    });
  }
}

module.exports = ExportQueries;
