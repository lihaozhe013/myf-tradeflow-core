# 核心业务逻辑

## 库存管理机制

### 库存计算原理
- **入库增加库存**: quantity > 0 时增加库存
- **出库减少库存**: quantity > 0 时减少库存  
- **允许负库存**: 系统允许库存为负数(前端警告提示)
- **实时计算**: 基于入库出库记录实时计算当前库存

### 库存缓存架构
**缓存文件**: `/data/stock-summary.json`

```json
{
  "last_updated": "2025-08-18T10:30:00.000Z",
  "total_cost_estimate": 125000.50,
  "products": {
    "iPhone 15": {
      "current_stock": 100,
      "last_inbound": "2025-08-15",
      "last_outbound": "2025-08-17"
    }
  }
}
```

### 库存更新机制
1. **手动刷新**: POST `/api/stock/refresh` 重新计算所有产品库存
2. **自动更新**: 入库出库操作后建议刷新库存缓存
3. **缓存优先**: 查询优先读取缓存，提升性能
4. **总成本估算**: 基于当前库存数量 × 最新进货单价

## 价格管理体系

### 价格历史机制
- **按生效日期管理**: 每个价格记录有生效日期
- **历史追溯**: 保留所有历史价格记录
- **智能查询**: 根据查询日期自动获取当时有效价格
- **价格继承**: 新价格生效前沿用旧价格

### 价格查询逻辑
```sql
-- 获取指定日期的有效价格
SELECT unit_price 
FROM product_prices 
WHERE partner_short_name = ? 
  AND product_model = ? 
  AND effective_date <= ?
ORDER BY effective_date DESC 
LIMIT 1;
```

### 自动价格获取
- **API**: `/api/product-prices/auto`
- **参数**: 供应商简称、产品型号、查询日期
- **返回**: 指定日期的有效单价
- **用途**: 入库出库时自动填充单价

## 财务计算规则

### 应收账款管理
```javascript
// 应收账款 = 出库总额 - 已收款额
const receivableBalance = decimalCalc.calculateBalance(
  totalOutboundAmount,   // 出库总额
  totalReceivedAmount    // 已收款额
);
```

**计算规则**:
- **正数余额**: 客户欠款
- **负数余额**: 预收款项/多收款
- **零余额**: 账务平衡

### 应付账款管理
```javascript
// 应付账款 = 入库总额 - 已付款额  
const payableBalance = decimalCalc.calculateBalance(
  totalInboundAmount,    // 入库总额
  totalPaidAmount        // 已付款额
);
```

### 已售商品成本计算
**加权平均成本法** - 用于概览统计和利润分析

```javascript
const calculateSoldGoodsCost = (outboundRecords, inboundRecords) => {
  // 1. 按产品分组计算加权平均成本
  const productCosts = {};
  
  inboundRecords.forEach(record => {
    const product = record.product_model;
    if (!productCosts[product]) {
      productCosts[product] = { totalCost: 0, totalQuantity: 0 };
    }
    
    const cost = decimalCalc.multiply(record.quantity, record.unit_price);
    productCosts[product].totalCost = decimalCalc.add(
      productCosts[product].totalCost, 
      cost
    );
    productCosts[product].totalQuantity += record.quantity;
  });
  
  // 2. 计算各产品平均成本
  const avgCosts = {};
  Object.keys(productCosts).forEach(product => {
    const data = productCosts[product];
    avgCosts[product] = decimalCalc.divide(data.totalCost, data.totalQuantity);
  });
  
  // 3. 按出库记录计算已售商品成本
  let totalSoldCost = new Decimal(0);
  outboundRecords.forEach(record => {
    const avgCost = avgCosts[record.product_model] || 0;
    const soldCost = decimalCalc.multiply(record.quantity, avgCost);
    totalSoldCost = decimalCalc.add(totalSoldCost, soldCost);
  });
  
  return totalSoldCost;
};
```

## 数据唯一性管理

### 客户供应商管理
**三项强绑定**: 代号、简称、全称必须一致
- **代号**: 业务编码，全局唯一
- **简称**: 显示名称，主键，全局唯一
- **全称**: 完整名称，用于正式文档

**数据同步规则**:
- 修改任意一项时，系统检查一致性
- 入库出库记录中的供应商/客户信息自动同步
- 删除客户供应商前检查关联记录

### 产品管理
**代号-型号绑定**: 产品代号和型号全局唯一
- **代号**: 内部编码
- **型号**: 对外显示的产品型号
- **类别**: 产品分类，支持配置化管理

## 概览统计机制

### 缓存分离架构
**设计原理**: 计算与查询分离，提升性能

#### POST刷新机制
```javascript
// POST /api/overview/stats - 执行所有计算
const refreshOverviewStats = async () => {
  const stats = {
    overview: calculateOverviewStats(),           // 总体统计
    out_of_stock_products: findOutOfStockProducts(), // 缺货产品
    top_sales_products: calculateTopSales(),      // 销售排行
    monthly_stock_changes: calculateMonthlyChanges() // 库存变化
  };
  
  // 写入缓存文件
  await fs.writeFileSync('/data/overview-stats.json', JSON.stringify(stats));
  return stats;
};
```

#### GET读取机制
```javascript
// GET /api/overview/stats - 纯读取缓存
const getOverviewStats = async () => {
  const cacheFile = '/data/overview-stats.json';
  if (fs.existsSync(cacheFile)) {
    return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
  }
  return { message: '请先刷新统计数据' };
};
```

### 统计数据计算

#### 销售额前10商品
```javascript
const calculateTopSales = () => {
  // 1. 按产品聚合销售额
  const productSales = {};
  outboundRecords.forEach(record => {
    const product = record.product_model;
    const sales = decimalCalc.multiply(record.quantity, record.unit_price);
    
    productSales[product] = decimalCalc.add(
      productSales[product] || 0,
      sales
    );
  });
  
  // 2. 排序取前10
  const sorted = Object.entries(productSales)
    .sort(([,a], [,b]) => Number(b) - Number(a))
    .slice(0, 10);
  
  // 3. 计算"其他"合计
  const top10Total = sorted.reduce((sum, [,sales]) => 
    decimalCalc.add(sum, sales), 0);
  const allTotal = Object.values(productSales).reduce((sum, sales) => 
    decimalCalc.add(sum, sales), 0);
  const otherTotal = decimalCalc.subtract(allTotal, top10Total);
  
  // 4. 组装结果
  const result = sorted.map(([product, sales]) => ({
    product_model: product,
    total_sales: Number(sales)
  }));
  
  if (otherTotal > 0) {
    result.push({
      product_model: '其他',
      total_sales: Number(otherTotal)
    });
  }
  
  return result;
};
```

#### 本月库存变化
```javascript
const calculateMonthlyStockChanges = () => {
  const currentDate = new Date();
  const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  // 预计算所有产品的本月变化
  const changes = {};
  products.forEach(product => {
    const monthStartStock = calculateStockAtDate(product.product_model, monthStart);
    const currentStock = getCurrentStock(product.product_model);
    
    changes[product.product_model] = {
      month_start_stock: monthStartStock,
      current_stock: currentStock,
      monthly_change: currentStock - monthStartStock
    };
  });
  
  return changes;
};
```

## 智能输入支持

### AutoComplete组件集成
- **客户供应商输入**: 支持代号或简称输入，自动补全
- **产品输入**: 支持产品代号或型号输入，自动补全
- **价格联动**: 选择供应商和产品后自动获取价格
- **数据验证**: 强制校验输入的客户供应商和产品存在性

### 输入验证规则
```javascript
// 客户供应商验证
const validatePartner = (input, type) => {
  const partners = getPartnersByType(type); // 0=供应商, 1=客户
  return partners.find(p => 
    p.code === input || p.short_name === input
  );
};

// 产品验证
const validateProduct = (input) => {
  const products = getAllProducts();
  return products.find(p => 
    p.code === input || p.product_model === input
  );
};
```

## 数据更新流程

### 入库操作流程
1. **数据验证**: 验证供应商、产品、价格信息
2. **记录创建**: 创建入库记录，自动计算总价
3. **库存更新**: 建议调用库存刷新API
4. **统计更新**: 建议刷新概览统计数据

### 出库操作流程
1. **数据验证**: 验证客户、产品、价格信息
2. **库存检查**: 检查库存是否充足(允许负库存)
3. **记录创建**: 创建出库记录，自动计算总价
4. **库存更新**: 建议调用库存刷新API
5. **统计更新**: 建议刷新概览统计数据

### 价格变更流程
1. **历史保留**: 新增价格记录，不删除历史价格
2. **生效日期**: 设置新价格的生效日期
3. **影响评估**: 检查影响的未来入库出库记录
4. **数据一致性**: 确保价格查询的准确性

---

*本文档最后更新: 2025年8月*
