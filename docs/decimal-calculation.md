# 精确计算架构 (decimal.js)

## 问题背景

### JavaScript浮点数精度问题
```javascript
// 问题示例
0.1 + 0.2 === 0.3                    // false
0.1 + 0.2                            // 0.30000000000000004
(0.1 * 3) - 0.3                      // 5.551115123125783e-17
```

### 财务系统影响
- **账务不平衡**: 累计误差导致总账不平
- **报表错误**: 金额计算偏差影响财务报表
- **用户体验**: 显示异常的小数位数

## 解决方案

### decimal.js集成
**decimal.js** - 高精度小数运算库，完美解决JavaScript浮点数精度问题

### 精度升级 (2025年8月)
- **原精度**: 2-4位小数
- **新精度**: 5位小数 (0.00001级别)
- **升级原因**: 支持更高精度商品单价和复杂计算
- **兼容性**: 向前兼容，无需数据迁移

## 工具类架构

### 核心文件
**位置**: `backend/utils/decimalCalculator.js`

### 配置参数
```javascript
Decimal.config({
  precision: 20,                    // 20位有效数字
  rounding: Decimal.ROUND_HALF_UP,  // 四舍五入
  toExpNeg: -9,                     // 负指数阈值
  toExpPos: 21,                     // 正指数阈值
  modulo: Decimal.ROUND_DOWN,
  crypto: false
});
```

### 精度标准
| 数据类型 | 小数位数 | 示例 |
|----------|----------|------|
| 金额/价格 | 5位 | 1234.56789 |
| 单价 | 5位 | 0.12345 |
| 数量 | 0位 | 100 |
| 百分比 | 1位 | 12.3% |
| 加权平均 | 5位 | 8.12345 |

## 核心方法

### 基础运算
```javascript
// 加法
decimalCalc.add(100.1, 200.2)        // 精确结果: 300.3

// 减法  
decimalCalc.subtract(300.3, 100.1)   // 精确结果: 200.2

// 乘法
decimalCalc.multiply(0.1, 3)          // 精确结果: 0.3

// 除法
decimalCalc.divide(1, 3)              // 精确结果: 0.33333
```

### 业务计算
```javascript
// 总价计算
decimalCalc.calculateTotalPrice(quantity, unitPrice)
// 替代: Math.round((quantity * unitPrice) * 100) / 100

// 余额计算
decimalCalc.calculateBalance(totalAmount, paidAmount)
// 用于应收应付账款余额

// 利润计算  
decimalCalc.calculateProfit(salesAmount, costAmount)

// 加权平均价格
decimalCalc.calculateWeightedAverage([
  { value: 100.5, weight: 10 },
  { value: 200.3, weight: 20 }
])
```

### 数据转换
```javascript
// SQL结果处理(防止null/undefined)
const amount = decimalCalc.fromSqlResult(
  row.amount,    // SQL查询结果
  0,             // 默认值
  5              // 小数位数
);

// 数据库存储格式转换
const dbValue = decimalCalc.toDbNumber(calculatedValue, 5);

// 批量计算总价
const records = decimalCalc.batchCalculateTotalPrice([
  { quantity: 10, unit_price: 100.5 },
  { quantity: 20, unit_price: 200.3 }
]);
```

## 应用覆盖范围

### 1. 入库出库记录
**文件**: `routes/inbound.js`, `routes/outbound.js`

```javascript
// 替换前
record.total_price = Math.round((quantity * unit_price) * 100) / 100;

// 替换后  
record.total_price = decimalCalc.calculateTotalPrice(quantity, unit_price);
```

### 2. 应收应付账款
**文件**: `routes/receivable.js`, `routes/payable.js`

```javascript
// 余额计算
const balance = decimalCalc.calculateBalance(
  totalReceivable, 
  totalPaid
);
```

### 3. 概览统计
**文件**: `routes/overview.js`

```javascript
// 已售商品成本(加权平均法)
const soldGoodsCost = decimalCalc.calculateWeightedAverage(costItems);

// 销售额聚合
const totalSales = decimalCalc.add(sales1, sales2);

// 利润率计算
const profitRate = decimalCalc.divide(
  decimalCalc.subtract(sales, cost),
  sales
);
```

### 4. 数据分析
**文件**: `routes/analysis/analysis.js`

```javascript
// 按维度分析计算
const analysisResult = {
  sales_amount: decimalCalc.fromSqlResult(result.sales_amount, 0, 5),
  cost_amount: calculateAnalysisCost(params),
  profit_amount: decimalCalc.subtract(salesAmount, costAmount),
  profit_rate: decimalCalc.multiply(
    decimalCalc.divide(profitAmount, salesAmount),
    100
  )
};
```

### 5. 导出查询
**文件**: `utils/exportQueries.js`

```javascript
// 应收应付汇总
const summary = items.map(item => ({
  ...item,
  balance: decimalCalc.calculateBalance(
    item.total_amount,
    item.paid_amount
  )
}));
```

## 测试验证

### 测试文件
- `backend/test-decimal.js` - 基础功能测试
- `backend/test-precision-5digits.js` - 高精度测试
- `backend/test-sales-precision.js` - 销售计算测试

### 测试用例
```javascript
// 基础运算精度
console.log('原生JS:', 0.1 + 0.2);              // 0.30000000000000004
console.log('decimal.js:', decimalCalc.add(0.1, 0.2)); // 0.3

// 总价计算对比
const quantity = 3;
const unitPrice = 0.1;
console.log('原生JS:', quantity * unitPrice);    // 0.30000000000000004
console.log('decimal.js:', decimalCalc.calculateTotalPrice(quantity, unitPrice)); // 0.3

// 高精度计算
const highPrecisionPrice = 123.45678;
const highPrecisionQuantity = 10;
const total = decimalCalc.calculateTotalPrice(highPrecisionQuantity, highPrecisionPrice);
console.log('高精度总价:', total); // 1234.5678
```

### 自动化测试
```bash
# 运行精度测试
node backend/test-decimal.js
node backend/test-precision-5digits.js

# 验证销售计算精度
node backend/test-sales-precision.js
```

## 性能考虑

### 性能影响
- **计算速度**: decimal.js比原生运算慢2-3倍
- **内存占用**: 每个Decimal对象占用更多内存
- **实际影响**: 对于ERP系统可忽略不计

### 优化策略
```javascript
// 1. 批量计算优化
const results = decimalCalc.batchCalculateTotalPrice(records);

// 2. 缓存Decimal实例
const cachedDecimal = new Decimal(commonValue);

// 3. 适时转换为原生数字
const dbNumber = decimalCalc.toDbNumber(result, 5);

// 4. 避免频繁字符串转换
const decimal = new Decimal(number); // 好
const decimal = new Decimal(string); // 避免频繁使用
```

## 开发规范

### 禁止原生运算
```javascript
// ❌ 禁止
const result = price * quantity + tax;
const balance = totalAmount - paidAmount;
const profitRate = (sales - cost) / sales * 100;

// ✅ 正确
const result = decimalCalc.add(
  decimalCalc.multiply(price, quantity),
  tax
);
const balance = decimalCalc.calculateBalance(totalAmount, paidAmount);
const profitRate = decimalCalc.calculateProfitRate(sales, cost);
```

### API返回处理
```javascript
// 确保API返回的金额都经过精确计算
const apiResponse = {
  total_amount: decimalCalc.toDbNumber(calculatedAmount, 5),
  balance: decimalCalc.toDbNumber(calculatedBalance, 5)
};
```

### 数据库操作
```javascript
// 存储前转换
const insertData = {
  amount: decimalCalc.toDbNumber(amount, 5),
  unit_price: decimalCalc.toDbNumber(unitPrice, 5)
};

// 读取后处理
const safeAmount = decimalCalc.fromSqlResult(row.amount, 0, 5);
```

## 迁移指南

### 现有代码升级
1. **识别计算点**: 查找所有金额、价格计算逻辑
2. **替换运算**: 使用decimal.js方法替换原生运算
3. **测试验证**: 对比计算结果确保正确性
4. **批量替换**: 使用工具类的批量方法优化性能

### 新功能开发
1. **强制使用**: 所有财务相关计算必须使用decimal.js
2. **代码审查**: 审查中检查精度计算规范
3. **测试覆盖**: 为计算逻辑编写精度测试用例

## 错误排查

### 常见问题
```javascript
// 1. 忘记使用decimal.js
const wrong = price * quantity; // 可能有精度问题

// 2. 混用原生运算和decimal.js
const wrong = decimalCalc.add(price, quantity * rate); // quantity * rate有精度问题

// 3. 不处理SQL结果的null值
const wrong = new Decimal(row.amount); // 如果amount为null会报错
```

### 调试技巧
```javascript
// 1. 启用详细日志
console.log('计算详情:', {
  input1: price,
  input2: quantity,
  result: decimalCalc.multiply(price, quantity).toString()
});

// 2. 比较原生运算结果
console.log('原生结果:', price * quantity);
console.log('精确结果:', decimalCalc.multiply(price, quantity).toString());

// 3. 检查数据类型
console.log('数据类型:', typeof price, typeof quantity);
```

---

*本文档最后更新: 2025年8月*
