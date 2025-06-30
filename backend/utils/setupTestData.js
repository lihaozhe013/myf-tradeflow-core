// 用于开发测试的数据填充脚本
const db = require('../db');

const setupTestData = () => {
  // 插入测试客户/供应商数据
  const partnersData = [
    { short_name: 'SUPP001', full_name: '北京供应商有限公司', address: '北京市朝阳区', contact_person: '张三', contact_phone: '13800000001', type: 0 },
    { short_name: 'SUPP002', full_name: '上海供应商有限公司', address: '上海市浦东新区', contact_person: '李四', contact_phone: '13800000002', type: 0 },
    { short_name: 'CUST001', full_name: '深圳客户有限公司', address: '深圳市南山区', contact_person: '王五', contact_phone: '13800000003', type: 1 },
    { short_name: 'CUST002', full_name: '广州客户有限公司', address: '广州市天河区', contact_person: '赵六', contact_phone: '13800000004', type: 1 },
  ];

  // 插入测试产品数据
  const productsData = [
    { short_name: 'RES001', category: '电阻', product_model: 'RES-1K-0805', remark: '1K欧姆 0805封装' },
    { short_name: 'CAP001', category: '电容', product_model: 'CAP-10UF-0603', remark: '10uF 0603封装' },
    { short_name: 'IC001', category: '集成电路', product_model: 'IC-MCU-STM32', remark: 'STM32微控制器' },
  ];

  // 插入测试产品价格数据
  const productPricesData = [
    { partner_short_name: 'SUPP001', product_model: 'RES-1K-0805', effective_date: '2024-01-01', unit_price: 0.002 },
    { partner_short_name: 'SUPP002', product_model: 'CAP-10UF-0603', effective_date: '2024-01-01', unit_price: 0.05 },
    { partner_short_name: 'SUPP001', product_model: 'IC-MCU-STM32', effective_date: '2024-01-01', unit_price: 2.5 },
  ];

  // 插入测试入库记录数据
  const inboundData = [
    {
      supplier_short_name: 'SUPP001',
      supplier_full_name: '北京供应商有限公司',
      product_model: 'RES-1K-0805',
      quantity: 1000,
      unit_price: 0.002,
      total_price: 2.0,
      inbound_date: '2024-01-15',
      invoice_number: 'INV-001',
      payment_amount: 2.0,
      payable_amount: 0,
      payment_method: '银行转账',
      remark: '测试入库数据1'
    },
    {
      supplier_short_name: 'SUPP002',
      supplier_full_name: '上海供应商有限公司',
      product_model: 'CAP-10UF-0603',
      quantity: 500,
      unit_price: 0.05,
      total_price: 25.0,
      inbound_date: '2024-01-20',
      invoice_number: 'INV-002',
      payment_amount: 20.0,
      payable_amount: 5.0,
      payment_method: '银行转账',
      remark: '测试入库数据2'
    }
  ];

  // 插入测试出库记录数据
  const outboundData = [
    {
      customer_short_name: 'CUST001',
      customer_full_name: '深圳客户有限公司',
      product_model: 'RES-1K-0805',
      quantity: 200,
      unit_price: 0.005,
      total_price: 1.0,
      outbound_date: '2024-01-25',
      invoice_number: 'OUT-001',
      collection_amount: 1.0,
      receivable_amount: 0,
      collection_method: '银行转账',
      remark: '测试出库数据1'
    }
  ];

  // 插入测试库存数据
  const stockData = [
    { record_id: 1, product_model: 'RES-1K-0805', stock_quantity: 800, update_time: '2024-01-25 10:00:00' },
    { record_id: 2, product_model: 'CAP-10UF-0603', stock_quantity: 500, update_time: '2024-01-20 14:30:00' },
  ];

  // 执行数据插入
  console.log('开始插入测试数据...');

  // 插入客户/供应商数据
  partnersData.forEach(partner => {
    db.run(
      `INSERT OR REPLACE INTO partners (short_name, full_name, address, contact_person, contact_phone, type) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [partner.short_name, partner.full_name, partner.address, partner.contact_person, partner.contact_phone, partner.type],
      function(err) {
        if (err) console.error('插入客户/供应商数据失败:', err);
      }
    );
  });

  // 插入产品数据
  productsData.forEach(product => {
    db.run(
      `INSERT OR REPLACE INTO products (short_name, category, product_model, remark) 
       VALUES (?, ?, ?, ?)`,
      [product.short_name, product.category, product.product_model, product.remark],
      function(err) {
        if (err) console.error('插入产品数据失败:', err);
      }
    );
  });

  // 插入产品价格数据
  productPricesData.forEach(price => {
    db.run(
      `INSERT INTO product_prices (partner_short_name, product_model, effective_date, unit_price) 
       VALUES (?, ?, ?, ?)`,
      [price.partner_short_name, price.product_model, price.effective_date, price.unit_price],
      function(err) {
        if (err) console.error('插入产品价格数据失败:', err);
      }
    );
  });

  // 插入入库记录数据
  inboundData.forEach(record => {
    db.run(
      `INSERT INTO inbound_records (supplier_short_name, supplier_full_name, product_model, quantity, unit_price, total_price, inbound_date, invoice_number, payment_amount, payable_amount, payment_method, remark) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [record.supplier_short_name, record.supplier_full_name, record.product_model, record.quantity, record.unit_price, record.total_price, record.inbound_date, record.invoice_number, record.payment_amount, record.payable_amount, record.payment_method, record.remark],
      function(err) {
        if (err) console.error('插入入库记录数据失败:', err);
      }
    );
  });

  // 插入出库记录数据
  outboundData.forEach(record => {
    db.run(
      `INSERT INTO outbound_records (customer_short_name, customer_full_name, product_model, quantity, unit_price, total_price, outbound_date, invoice_number, collection_amount, receivable_amount, collection_method, remark) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [record.customer_short_name, record.customer_full_name, record.product_model, record.quantity, record.unit_price, record.total_price, record.outbound_date, record.invoice_number, record.collection_amount, record.receivable_amount, record.collection_method, record.remark],
      function(err) {
        if (err) console.error('插入出库记录数据失败:', err);
      }
    );
  });

  // 插入库存数据
  stockData.forEach(stock => {
    db.run(
      `INSERT INTO stock (record_id, product_model, stock_quantity, update_time) 
       VALUES (?, ?, ?, ?)`,
      [stock.record_id, stock.product_model, stock.stock_quantity, stock.update_time],
      function(err) {
        if (err) console.error('插入库存数据失败:', err);
      }
    );
  });

  console.log('测试数据插入完成！');
};

module.exports = { setupTestData }; 