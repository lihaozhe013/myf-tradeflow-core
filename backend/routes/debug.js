const express = require('express');
const router = express.Router();
const db = require('../db');

// 获取系统统计数据
router.get('/stats', (req, res) => {
  const stats = {};
  let completed = 0;
  const totalQueries = 8;

  // 基础统计查询
  const queries = [
    // 总体数据统计
    {
      key: 'overview',
      query: `
        SELECT 
          (SELECT COUNT(*) FROM inbound_records) as total_inbound,
          (SELECT COUNT(*) FROM outbound_records) as total_outbound,
          (SELECT COUNT(*) FROM partners WHERE type = 0) as suppliers_count,
          (SELECT COUNT(*) FROM partners WHERE type = 1) as customers_count,
          (SELECT COUNT(*) FROM products) as products_count,
          (SELECT COUNT(DISTINCT product_model) FROM stock) as stocked_products,
          (SELECT SUM(total_price) FROM inbound_records) as total_purchase_amount,
          (SELECT SUM(total_price) FROM outbound_records) as total_sales_amount
      `
    },
    // 最近7天的入库趋势
    {
      key: 'inbound_trend',
      query: `
        SELECT 
          inbound_date as date,
          COUNT(*) as count,
          SUM(total_price) as amount
        FROM inbound_records 
        WHERE date(inbound_date) >= date('now', '-7 days')
        GROUP BY inbound_date
        ORDER BY inbound_date DESC
      `
    },
    // 最近7天的出库趋势
    {
      key: 'outbound_trend',
      query: `
        SELECT 
          outbound_date as date,
          COUNT(*) as count,
          SUM(total_price) as amount
        FROM outbound_records 
        WHERE date(outbound_date) >= date('now', '-7 days')
        GROUP BY outbound_date
        ORDER BY outbound_date DESC
      `
    },
    // 库存状态分析
    {
      key: 'stock_analysis',
      query: `
        SELECT 
          CASE 
            WHEN stock_quantity <= 0 THEN '缺货'
            WHEN stock_quantity <= 10 THEN '库存不足'
            WHEN stock_quantity <= 50 THEN '库存正常'
            ELSE '库存充足'
          END as status,
          COUNT(*) as count
        FROM (
          SELECT product_model, 
                 SUM(CASE WHEN record_id < 0 THEN -stock_quantity ELSE stock_quantity END) as stock_quantity
          FROM stock 
          GROUP BY product_model
        ) as stock_summary
        GROUP BY status
      `
    },
    // 热门产品（按出库量）
    {
      key: 'popular_products',
      query: `
        SELECT 
          product_model,
          SUM(quantity) as total_quantity,
          SUM(total_price) as total_amount,
          COUNT(*) as order_count
        FROM outbound_records
        GROUP BY product_model
        ORDER BY total_quantity DESC
        LIMIT 10
      `
    },
    // 主要客户（按销售额）
    {
      key: 'top_customers',
      query: `
        SELECT 
          customer_short_name,
          SUM(total_price) as total_amount,
          COUNT(*) as order_count
        FROM outbound_records
        GROUP BY customer_short_name
        ORDER BY total_amount DESC
        LIMIT 10
      `
    },
    // 主要供应商（按采购额）
    {
      key: 'top_suppliers',
      query: `
        SELECT 
          supplier_short_name,
          SUM(total_price) as total_amount,
          COUNT(*) as order_count
        FROM inbound_records
        GROUP BY supplier_short_name
        ORDER BY total_amount DESC
        LIMIT 10
      `
    },
    // 月度趋势统计
    {
      key: 'monthly_trend',
      query: `
        SELECT 
          strftime('%Y-%m', inbound_date) as month,
          COUNT(*) as inbound_count,
          SUM(total_price) as inbound_amount,
          0 as outbound_count,
          0 as outbound_amount
        FROM inbound_records
        WHERE date(inbound_date) >= date('now', '-6 months')
        GROUP BY strftime('%Y-%m', inbound_date)
        
        UNION ALL
        
        SELECT 
          strftime('%Y-%m', outbound_date) as month,
          0 as inbound_count,
          0 as inbound_amount,
          COUNT(*) as outbound_count,
          SUM(total_price) as outbound_amount
        FROM outbound_records
        WHERE date(outbound_date) >= date('now', '-6 months')
        GROUP BY strftime('%Y-%m', outbound_date)
        
        ORDER BY month DESC
      `
    }
  ];

  // 执行所有查询
  queries.forEach(({ key, query }) => {
    db.all(query, [], (err, rows) => {
      if (err) {
        console.error(`Error in ${key} query:`, err);
        stats[key] = { error: err.message };
      } else {
        stats[key] = rows;
      }
      
      completed++;
      if (completed === totalQueries) {
        res.json(stats);
      }
    });
  });
});

// 调试接口：获取所有表的数据（保留原有功能）
router.get('/all-tables', (req, res) => {
  const queries = {
    inbound_records: 'SELECT * FROM inbound_records ORDER BY id DESC',
    outbound_records: 'SELECT * FROM outbound_records ORDER BY id DESC',
    stock: 'SELECT * FROM stock ORDER BY update_time DESC',
    partners: 'SELECT * FROM partners ORDER BY short_name',
    product_prices: 'SELECT * FROM product_prices ORDER BY effective_date DESC'
  };

  const results = {};
  const tableNames = Object.keys(queries);
  let completed = 0;

  tableNames.forEach(tableName => {
    db.all(queries[tableName], [], (err, rows) => {
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

// 设置测试数据
router.post('/setup-test-data', (req, res) => {
  const testData = {
    // 测试供应商
    suppliers: [
      { code: 'SP001', short_name: '华为科技', full_name: '华为技术有限公司', address: '深圳市龙岗区', contact_person: '张经理', contact_phone: '13800138001', type: 0 },
      { code: 'SP002', short_name: '小米集团', full_name: '小米科技有限责任公司', address: '北京市海淀区', contact_person: '李经理', contact_phone: '13800138002', type: 0 },
      { code: 'SP003', short_name: '联想集团', full_name: '联想(北京)有限公司', address: '北京市海淀区', contact_person: '王经理', contact_phone: '13800138003', type: 0 }
    ],
    // 测试客户
    customers: [
      { code: 'CU001', short_name: '京东商城', full_name: '北京京东世纪贸易有限公司', address: '北京市朝阳区', contact_person: '刘经理', contact_phone: '13900139001', type: 1 },
      { code: 'CU002', short_name: '天猫超市', full_name: '浙江天猫技术有限公司', address: '杭州市余杭区', contact_person: '陈经理', contact_phone: '13900139002', type: 1 },
      { code: 'CU003', short_name: '苏宁易购', full_name: '苏宁易购集团股份有限公司', address: '南京市玄武区', contact_person: '赵经理', contact_phone: '13900139003', type: 1 },
      { code: 'CU004', short_name: '国美电器', full_name: '国美电器有限公司', address: '北京市朝阳区', contact_person: '孙经理', contact_phone: '13900139004', type: 1 }
    ],
    // 测试产品
    products: [
      { code: 'PD001', category: '智能手机', product_model: 'iPhone 15 Pro', remark: '苹果最新旗舰手机' },
      { code: 'PD002', category: '智能手机', product_model: 'Samsung Galaxy S24', remark: '三星旗舰手机' },
      { code: 'PD003', category: '笔记本电脑', product_model: 'MacBook Pro M3', remark: '苹果笔记本电脑' },
      { code: 'PD004', category: '笔记本电脑', product_model: 'ThinkPad X1 Carbon', remark: '联想商务笔记本' },
      { code: 'PD005', category: '平板电脑', product_model: 'iPad Air 5', remark: '苹果平板电脑' }
    ]
  };

  let completed = 0;
  let totalOperations = 0;
  const results = { success: true, message: '测试数据设置完成', details: [] };

  // 计算总操作数
  totalOperations = testData.suppliers.length + testData.customers.length + testData.products.length;

  // 插入供应商数据
  testData.suppliers.forEach(supplier => {
    const sql = `INSERT OR REPLACE INTO partners (code, short_name, full_name, address, contact_person, contact_phone, type) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [supplier.code, supplier.short_name, supplier.full_name, supplier.address, supplier.contact_person, supplier.contact_phone, supplier.type], function(err) {
      if (err) {
        results.details.push(`供应商 ${supplier.short_name} 插入失败: ${err.message}`);
      } else {
        results.details.push(`供应商 ${supplier.short_name} 插入成功`);
      }
      completed++;
      if (completed === totalOperations) {
        // 数据插入完成后，生成一些入库和出库记录
        generateSampleRecords(res, results);
      }
    });
  });

  // 插入客户数据
  testData.customers.forEach(customer => {
    const sql = `INSERT OR REPLACE INTO partners (code, short_name, full_name, address, contact_person, contact_phone, type) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [customer.code, customer.short_name, customer.full_name, customer.address, customer.contact_person, customer.contact_phone, customer.type], function(err) {
      if (err) {
        results.details.push(`客户 ${customer.short_name} 插入失败: ${err.message}`);
      } else {
        results.details.push(`客户 ${customer.short_name} 插入成功`);
      }
      completed++;
      if (completed === totalOperations) {
        generateSampleRecords(res, results);
      }
    });
  });

  // 插入产品数据
  testData.products.forEach(product => {
    const sql = `INSERT OR REPLACE INTO products (code, category, product_model, remark) 
                 VALUES (?, ?, ?, ?)`;
    db.run(sql, [product.code, product.category, product.product_model, product.remark], function(err) {
      if (err) {
        results.details.push(`产品 ${product.product_model} 插入失败: ${err.message}`);
      } else {
        results.details.push(`产品 ${product.product_model} 插入成功`);
      }
      completed++;
      if (completed === totalOperations) {
        generateSampleRecords(res, results);
      }
    });
  });
});

// 生成样本入库出库记录
function generateSampleRecords(res, results) {
  const today = new Date();
  const getDateString = (daysAgo) => {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  };

  // 样本入库记录
  const sampleInbounds = [
    { supplier_code: 'SP001', supplier_short_name: '华为科技', supplier_full_name: '华为技术有限公司', product_code: 'PD001', product_model: 'iPhone 15 Pro', quantity: 50, unit_price: 8999, date: getDateString(7) },
    { supplier_code: 'SP002', supplier_short_name: '小米集团', supplier_full_name: '小米科技有限责任公司', product_code: 'PD002', product_model: 'Samsung Galaxy S24', quantity: 30, unit_price: 7999, date: getDateString(6) },
    { supplier_code: 'SP003', supplier_short_name: '联想集团', supplier_full_name: '联想(北京)有限公司', product_code: 'PD004', product_model: 'ThinkPad X1 Carbon', quantity: 25, unit_price: 12999, date: getDateString(5) },
    { supplier_code: 'SP001', supplier_short_name: '华为科技', supplier_full_name: '华为技术有限公司', product_code: 'PD003', product_model: 'MacBook Pro M3', quantity: 20, unit_price: 15999, date: getDateString(4) },
    { supplier_code: 'SP002', supplier_short_name: '小米集团', supplier_full_name: '小米科技有限责任公司', product_code: 'PD005', product_model: 'iPad Air 5', quantity: 40, unit_price: 4999, date: getDateString(3) }
  ];

  // 样本出库记录
  const sampleOutbounds = [
    { customer_code: 'CU001', customer_short_name: '京东商城', customer_full_name: '北京京东世纪贸易有限公司', product_code: 'PD001', product_model: 'iPhone 15 Pro', quantity: 15, unit_price: 9999, date: getDateString(2) },
    { customer_code: 'CU002', customer_short_name: '天猫超市', customer_full_name: '浙江天猫技术有限公司', product_code: 'PD002', product_model: 'Samsung Galaxy S24', quantity: 10, unit_price: 8999, date: getDateString(2) },
    { customer_code: 'CU003', customer_short_name: '苏宁易购', customer_full_name: '苏宁易购集团股份有限公司', product_code: 'PD004', product_model: 'ThinkPad X1 Carbon', quantity: 8, unit_price: 13999, date: getDateString(1) },
    { customer_code: 'CU004', customer_short_name: '国美电器', customer_full_name: '国美电器有限公司', product_code: 'PD003', product_model: 'MacBook Pro M3', quantity: 5, unit_price: 16999, date: getDateString(1) },
    { customer_code: 'CU001', customer_short_name: '京东商城', customer_full_name: '北京京东世纪贸易有限公司', product_code: 'PD005', product_model: 'iPad Air 5', quantity: 12, unit_price: 5499, date: getDateString(0) }
  ];

  let recordCompleted = 0;
  const totalRecords = sampleInbounds.length + sampleOutbounds.length;

  // 插入入库记录
  sampleInbounds.forEach(record => {
    const sql = `INSERT INTO inbound_records (supplier_code, supplier_short_name, supplier_full_name, product_code, product_model, quantity, unit_price, total_price, inbound_date, invoice_number, remark) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const totalPrice = record.quantity * record.unit_price;
    db.run(sql, [record.supplier_code, record.supplier_short_name, record.supplier_full_name, record.product_code, record.product_model, record.quantity, record.unit_price, totalPrice, record.date, `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, '测试数据'], function(err) {
      if (err) {
        results.details.push(`入库记录插入失败: ${err.message}`);
      } else {
        results.details.push(`入库记录插入成功: ${record.product_model} x${record.quantity}`);
        // 更新库存
        updateStock(this.lastID, record.product_model, record.quantity);
      }
      recordCompleted++;
      if (recordCompleted === totalRecords) {
        res.json(results);
      }
    });
  });

  // 插入出库记录
  sampleOutbounds.forEach(record => {
    const sql = `INSERT INTO outbound_records (customer_code, customer_short_name, customer_full_name, product_code, product_model, quantity, unit_price, total_price, outbound_date, invoice_number, remark) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const totalPrice = record.quantity * record.unit_price;
    db.run(sql, [record.customer_code, record.customer_short_name, record.customer_full_name, record.product_code, record.product_model, record.quantity, record.unit_price, totalPrice, record.date, `OUT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, '测试数据'], function(err) {
      if (err) {
        results.details.push(`出库记录插入失败: ${err.message}`);
      } else {
        results.details.push(`出库记录插入成功: ${record.product_model} x${record.quantity}`);
        // 更新库存
        updateStock(-this.lastID, record.product_model, -record.quantity);
      }
      recordCompleted++;
      if (recordCompleted === totalRecords) {
        res.json(results);
      }
    });
  });
}

// 更新库存函数
function updateStock(recordId, productModel, quantity) {
  // 查询当前库存
  db.get('SELECT SUM(CASE WHEN record_id < 0 THEN -stock_quantity ELSE stock_quantity END) as current_stock FROM stock WHERE product_model = ?', [productModel], (err, row) => {
    const currentStock = (row && row.current_stock) || 0;
    const newStock = currentStock + quantity;
    
    // 插入库存记录
    const sql = 'INSERT INTO stock (record_id, product_model, stock_quantity, update_time) VALUES (?, ?, ?, ?)';
    db.run(sql, [recordId, productModel, newStock, new Date().toISOString()], (err) => {
      if (err) {
        console.error('库存更新失败:', err);
      }
    });
  });
}

module.exports = router;