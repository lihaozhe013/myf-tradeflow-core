const db = require('../db');

// 库存明细报表
function getStockReport(callback) {
  const sql = `
    SELECT
      p.category,
      p.product_model,
      COALESCE(SUM(CASE WHEN s.record_id IN (SELECT id FROM inbound_records) THEN s.stock_quantity ELSE 0 END), 0) as total_inbound,
      COALESCE(SUM(CASE WHEN s.record_id IN (SELECT id FROM outbound_records) THEN ABS(s.stock_quantity) ELSE 0 END), 0) as total_outbound,
      COALESCE(SUM(s.stock_quantity), 0) as current_stock,
      MAX(s.update_time) as last_update
    FROM products p
    LEFT JOIN stock s ON p.product_model = s.product_model
    GROUP BY p.category, p.product_model
    ORDER BY p.category, p.product_model
  `;
  
  db.all(sql, [], callback);
}

// 进出货明细报表
function getInOutReport(startDate, endDate, productModel, callback) {
  let inboundSql = `
    SELECT 'inbound' as type, id, supplier_short_name as partner_name, product_model, 
           quantity, unit_price, total_price, inbound_date as date, remark
    FROM inbound_records WHERE 1=1
  `;
  
  let outboundSql = `
    SELECT 'outbound' as type, id, customer_short_name as partner_name, product_model, 
           quantity, unit_price, total_price, outbound_date as date, remark
    FROM outbound_records WHERE 1=1
  `;
  
  let params = [];
  
  if (startDate) {
    inboundSql += ' AND inbound_date >= ?';
    outboundSql += ' AND outbound_date >= ?';
    params.push(startDate, startDate);
  }
  if (endDate) {
    inboundSql += ' AND inbound_date <= ?';
    outboundSql += ' AND outbound_date <= ?';
    params.push(endDate, endDate);
  }
  if (productModel) {
    inboundSql += ' AND product_model LIKE ?';
    outboundSql += ' AND product_model LIKE ?';
    params.push(`%${productModel}%`, `%${productModel}%`);
  }
  
  const unionSql = `
    ${inboundSql}
    UNION ALL
    ${outboundSql}
    ORDER BY date DESC, type, id
  `;
  
  db.all(unionSql, params, callback);
}

// 收支统计报表
function getFinanceReport(startDate, endDate, groupBy = 'month', callback) {
  let dateFormat;
  if (groupBy === 'day') {
    dateFormat = '%Y-%m-%d';
  } else if (groupBy === 'month') {
    dateFormat = '%Y-%m';
  } else {
    dateFormat = '%Y';
  }
  
  let sql = `
    SELECT 
      strftime('${dateFormat}', inbound_date) as period,
      SUM(total_price) as total_purchase,
      SUM(payment_amount) as total_payment,
      SUM(payable_amount) as total_payable
    FROM inbound_records
    WHERE 1=1
  `;
  
  let params = [];
  
  if (startDate) {
    sql += ' AND inbound_date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    sql += ' AND inbound_date <= ?';
    params.push(endDate);
  }
  
  sql += ` GROUP BY strftime('${dateFormat}', inbound_date)`;
  
  db.all(sql, params, (err, purchaseRows) => {
    if (err) {
      return callback(err);
    }
    
    let salesSql = `
      SELECT 
        strftime('${dateFormat}', outbound_date) as period,
        SUM(total_price) as total_sales,
        SUM(collection_amount) as total_collection,
        SUM(receivable_amount) as total_receivable
      FROM outbound_records
      WHERE 1=1
    `;
    
    let salesParams = [];
    
    if (startDate) {
      salesSql += ' AND outbound_date >= ?';
      salesParams.push(startDate);
    }
    if (endDate) {
      salesSql += ' AND outbound_date <= ?';
      salesParams.push(endDate);
    }
    
    salesSql += ` GROUP BY strftime('${dateFormat}', outbound_date)`;
    
    db.all(salesSql, salesParams, (err, salesRows) => {
      if (err) {
        return callback(err);
      }
      
      // 合并采购和销售数据
      const financeData = {};
      
      purchaseRows.forEach(row => {
        financeData[row.period] = {
          period: row.period,
          total_purchase: row.total_purchase || 0,
          total_payment: row.total_payment || 0,
          total_payable: row.total_payable || 0,
          total_sales: 0,
          total_collection: 0,
          total_receivable: 0
        };
      });
      
      salesRows.forEach(row => {
        if (financeData[row.period]) {
          financeData[row.period].total_sales = row.total_sales || 0;
          financeData[row.period].total_collection = row.total_collection || 0;
          financeData[row.period].total_receivable = row.total_receivable || 0;
        } else {
          financeData[row.period] = {
            period: row.period,
            total_purchase: 0,
            total_payment: 0,
            total_payable: 0,
            total_sales: row.total_sales || 0,
            total_collection: row.total_collection || 0,
            total_receivable: row.total_receivable || 0
          };
        }
      });
      
      // 计算利润
      const result = Object.values(financeData).map(item => ({
        ...item,
        profit: item.total_sales - item.total_purchase,
        net_cash_flow: item.total_collection - item.total_payment
      }));
      
      result.sort((a, b) => a.period.localeCompare(b.period));
      
      callback(null, result);
    });
  });
}

module.exports = {
  getStockReport,
  getInOutReport,
  getFinanceReport
}; 