/**
 * 高精度计算测试 - 验证 0.00001 级别精度
 */
const decimalCalc = require('./utils/decimalCalculator');

console.log('=== 高精度计算测试（支持0.00001精度）===\n');

// 1. 基础运算精度测试
console.log('1. 基础运算精度测试：');
console.log('0.1 + 0.2 =', decimalCalc.toNumber(decimalCalc.add(0.1, 0.2), 5));
console.log('1.23456 × 2.34567 =', decimalCalc.toNumber(decimalCalc.multiply(1.23456, 2.34567), 5));
console.log('10.12345 ÷ 3 =', decimalCalc.toNumber(decimalCalc.divide(10.12345, 3), 5));
console.log('5.67890 - 1.11111 =', decimalCalc.toNumber(decimalCalc.subtract(5.67890, 1.11111), 5));

// 2. 总价计算测试（支持高精度单价）
console.log('\n2. 总价计算测试：');
console.log('数量: 123, 单价: 0.12345 =', decimalCalc.calculateTotalPrice(123, 0.12345));
console.log('数量: 0.5, 单价: 99.99999 =', decimalCalc.calculateTotalPrice(0.5, 99.99999));
console.log('数量: 1000, 单价: 0.00123 =', decimalCalc.calculateTotalPrice(1000, 0.00123));

// 3. 余额计算测试
console.log('\n3. 余额计算测试：');
console.log('总额: 1000.12345, 已付: 500.67890 =', decimalCalc.calculateBalance(1000.12345, 500.67890));
console.log('总额: 123.45678, 已付: 123.45677 =', decimalCalc.calculateBalance(123.45678, 123.45677));

// 4. 加权平均价格测试
console.log('\n4. 加权平均价格测试：');
const priceItems = [
  { quantity: 100, price: 12.34567 },
  { quantity: 200, price: 23.45678 },
  { quantity: 50, price: 34.56789 }
];
console.log('加权平均价格 =', decimalCalc.calculateWeightedAverage(priceItems));

// 5. 精度边界测试
console.log('\n5. 精度边界测试：');
console.log('0.00001 + 0.00001 =', decimalCalc.toNumber(decimalCalc.add(0.00001, 0.00001), 5));
console.log('0.99999 + 0.00001 =', decimalCalc.toNumber(decimalCalc.add(0.99999, 0.00001), 5));
console.log('1 ÷ 3 × 3 =', decimalCalc.toNumber(decimalCalc.multiply(decimalCalc.divide(1, 3), 3), 5));

// 6. 求和测试
console.log('\n6. 高精度求和测试：');
const values = [0.12345, 0.23456, 0.34567, 0.45678, 0.56789];
console.log('求和:', values.join(' + '), '=', decimalCalc.sum(values));

// 7. 数据库存储格式测试
console.log('\n7. 数据库存储格式测试：');
console.log('123.456789 -> DB格式 =', decimalCalc.toDbNumber(123.456789, 5));
console.log('null -> DB格式 =', decimalCalc.fromSqlResult(null, 0, 5));
console.log('999.123456 -> DB格式 =', decimalCalc.fromSqlResult(999.123456, 0, 5));

// 8. 对比原生JS计算
console.log('\n8. 原生JS vs decimal.js 对比：');
const a = 0.12345;
const b = 0.67890;
console.log('原生JS:', a + b);
console.log('decimal.js:', decimalCalc.toNumber(decimalCalc.add(a, b), 5));

console.log('\n=== 测试完成 ===');
