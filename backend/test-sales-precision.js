const decimalCalc = require('./utils/decimalCalculator');

/**
 * 测试销售额计算精度
 * 模拟 top_sales_products 计算逻辑
 */
function testTopSalesCalculation() {
  console.log('🧮 测试销售额计算精度...\n');

  // 模拟从数据库返回的数据（包含浮点数精度问题）
  const mockSqlResults = [
    { product_model: 'Product A', total_sales: 5600.000000000001 },
    { product_model: 'Product B', total_sales: 3400.999999999999 },
    { product_model: 'Product C', total_sales: 2200.5000000000005 },
    { product_model: 'Product D', total_sales: 1100.3333333333333 }
  ];

  console.log('=== 原始 SQL 结果（含精度问题）===');
  mockSqlResults.forEach(item => {
    console.log(`${item.product_model}: ${item.total_sales}`);
  });

  console.log('\n=== 使用 decimal.js 处理后 ===');
  
  // 模拟我们的新处理逻辑
  const processedRows = mockSqlResults.map(row => ({
    product_model: row.product_model,
    total_sales: decimalCalc.fromSqlResult(row.total_sales, 0, 2)
  }));

  processedRows.forEach(item => {
    console.log(`${item.product_model}: ${item.total_sales}`);
  });

  // 测试"其他"类别的求和
  console.log('\n=== 测试"其他"类别求和 ===');
  const topN = 2;
  const top = processedRows.slice(0, topN);
  const others = processedRows.slice(topN);

  console.log('前2名:');
  top.forEach(item => console.log(`  ${item.product_model}: ${item.total_sales}`));

  console.log('其他商品:');
  others.forEach(item => console.log(`  ${item.product_model}: ${item.total_sales}`));

  // 原生 JavaScript 求和（有精度问题）
  const nativeSumOthers = others.reduce((sum, r) => sum + r.total_sales, 0);
  console.log(`原生 JS 求和: ${nativeSumOthers}`);

  // decimal.js 求和（精确）
  const decimalSumOthers = others.reduce((sum, r) => {
    return decimalCalc.add(sum, r.total_sales);
  }, 0);
  const preciseSumOthers = decimalCalc.toDbNumber(decimalSumOthers, 2);
  console.log(`decimal.js 求和: ${preciseSumOthers}`);

  console.log('\n✅ 测试完成！');
}

// 如果直接运行此文件则执行测试
if (require.main === module) {
  testTopSalesCalculation();
}

module.exports = testTopSalesCalculation;
