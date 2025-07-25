// 导出数据查询模块
const db = require('../db');

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
        if (err) reject(err);
        else resolve(rows || []);
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
        if (err) reject(err);
        else resolve(rows || []);
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
}

module.exports = ExportQueries;
