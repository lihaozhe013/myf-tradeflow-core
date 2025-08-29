# 数据分析功能

## 功能概述

数据分析模块支持按时间区间、客户、产品维度进行销售数据分析，计算销售额、成本、利润和利润率。

## 核心特性

- **多维度分析**: 按时间、客户、产品维度组合分析
- **详细分析**: 客户各产品明细或产品各客户明细
- **缓存机制**: 双重缓存提升查询性能
- **导出功能**: 支持Excel导出，包含汇总和明细数据
- **高级导出**: 批量按客户或产品分类导出

## 分析维度

### 时间维度
- **必选条件**: 必须指定时间区间
- **默认值**: 上个月第一天到最后一天
- **格式**: YYYY-MM-DD

### 客户维度
- **全部客户**: 分析所有客户数据
- **指定客户**: 分析特定客户数据
- **详细分析**: 指定客户时显示该客户各产品明细

### 产品维度
- **全部产品**: 分析所有产品数据  
- **指定产品**: 分析特定产品数据
- **详细分析**: 指定产品时显示该产品各客户明细

## 计算逻辑

### 销售额计算
```javascript
// 正数单价出库记录的销售额汇总
const salesAmount = outboundRecords
  .filter(record => record.unit_price > 0)
  .reduce((sum, record) => 
    decimalCalc.add(sum, decimalCalc.multiply(record.quantity, record.unit_price)), 0);

// 减去负数单价出库记录(特殊支出)
const specialExpenses = outboundRecords
  .filter(record => record.unit_price < 0)
  .reduce((sum, record) => 
    decimalCalc.add(sum, Math.abs(decimalCalc.multiply(record.quantity, record.unit_price))), 0);

const finalSalesAmount = decimalCalc.subtract(salesAmount, specialExpenses);
```

### 成本计算(加权平均法)
```javascript
const calculateAnalysisCost = (params) => {
  // 1. 获取全时间范围的入库记录计算平均成本
  const allInboundRecords = getInboundRecords(); // 不限时间
  
  // 2. 按产品计算加权平均成本
  const productCosts = {};
  allInboundRecords.forEach(record => {
    const product = record.product_model;
    if (!productCosts[product]) {
      productCosts[product] = { totalCost: 0, totalQuantity: 0 };
    }
    
    const cost = decimalCalc.multiply(record.quantity, record.unit_price);
    productCosts[product].totalCost = decimalCalc.add(productCosts[product].totalCost, cost);
    productCosts[product].totalQuantity += record.quantity;
  });
  
  // 3. 计算各产品平均成本
  const avgCosts = {};
  Object.keys(productCosts).forEach(product => {
    const data = productCosts[product];
    avgCosts[product] = decimalCalc.divide(data.totalCost, data.totalQuantity);
  });
  
  // 4. 按指定条件的出库记录计算成本
  const outboundRecords = getOutboundRecords(params); // 按条件筛选
  let totalCost = new Decimal(0);
  outboundRecords.forEach(record => {
    const avgCost = avgCosts[record.product_model] || 0;
    const cost = decimalCalc.multiply(record.quantity, avgCost);
    totalCost = decimalCalc.add(totalCost, cost);
  });
  
  return totalCost;
};
```

### 利润和利润率
```javascript
// 利润 = 销售额 - 成本
const profitAmount = decimalCalc.subtract(salesAmount, costAmount);

// 利润率 = (利润 / 销售额) × 100%
const profitRate = salesAmount > 0 ? 
  decimalCalc.multiply(decimalCalc.divide(profitAmount, salesAmount), 100) : 0;
```

## 缓存机制

### 缓存文件
**位置**: `/data/analysis-cache.json`

### 缓存键规则
```javascript
const cacheKey = `${start_date}_${end_date}_${customer_code || 'ALL'}_${product_model || 'ALL'}`;
const detailCacheKey = `detail_${cacheKey}`;
```

### 缓存结构
```json
{
  "2025-01-01_2025-01-31_ALL_ALL": {
    "sales_amount": 150000.00,
    "cost_amount": 120000.00,
    "profit_amount": 30000.00,
    "profit_rate": 20.00,
    "query_params": {
      "start_date": "2025-01-01",
      "end_date": "2025-01-31",
      "customer_code": "ALL",
      "product_model": "ALL"
    },
    "last_updated": "2025-08-18T10:30:00.000Z"
  },
  "detail_2025-01-01_2025-01-31_C001_ALL": {
    "detail_data": [
      {
        "group_key": "iPhone 15 Pro",
        "customer_code": "C001",
        "product_model": "iPhone 15 Pro", 
        "sales_amount": 50000.00,
        "cost_amount": 40000.00,
        "profit_amount": 10000.00,
        "profit_rate": 20.00
      }
    ],
    "last_updated": "2025-08-18T10:30:00.000Z"
  }
}
```

### 缓存策略
- **读写分离**: GET请求只读缓存，POST请求重新计算
- **自动过期**: 自动清理30天以上过期数据
- **双重缓存**: 基础分析和详细分析分别缓存

## API接口

### 获取分析数据
```
GET /api/analysis/data
Query Parameters:
- start_date: 开始日期 (必选)
- end_date: 结束日期 (必选)  
- customer_code: 客户代号 (可选)
- product_model: 产品型号 (可选)

Response:
{
  "sales_amount": 150000.00,
  "cost_amount": 120000.00, 
  "profit_amount": 30000.00,
  "profit_rate": 20.00,
  "last_updated": "2025-08-18T10:30:00.000Z"
}
```

### 获取详细分析
```
GET /api/analysis/detail
Query Parameters: 同上

Response:
{
  "detail_data": [
    {
      "group_key": "iPhone 15",
      "customer_code": "C001",
      "product_model": "iPhone 15",
      "sales_amount": 50000.00,
      "cost_amount": 40000.00,
      "profit_amount": 10000.00,
      "profit_rate": 20.00
    }
  ]
}
```

### 刷新分析数据
```
POST /api/analysis/refresh
Request Body:
{
  "start_date": "2025-01-01",
  "end_date": "2025-01-31",
  "customer_code": "C001",
  "product_model": "iPhone"
}
```

### 获取筛选选项
```
GET /api/analysis/filter-options

Response:
{
  "customers": [
    { "code": "C001", "short_name": "经销商A" }
  ],
  "products": [
    { "product_model": "iPhone 15" }
  ]
}
```

## 前端组件架构

### 重构后架构 (2025年8月)
```
Analysis/
├── index.jsx                    # 主页面(130行，精简版)
├── components/
│   ├── AnalysisFilters.jsx     # 筛选条件组件
│   ├── AnalysisStatistics.jsx  # 统计卡片组件
│   ├── AnalysisDetailTable.jsx # 详细表格组件
│   ├── AnalysisConditions.jsx  # 条件显示组件
│   └── AdvancedExportModal.jsx # 高级导出弹窗
└── hooks/
    ├── useAnalysisData.js      # 数据管理钩子
    └── useAnalysisExport.js    # 导出功能钩子
```

### 用户交互逻辑

#### 初始状态
- 时间区间默认为上个月
- 客户和产品筛选默认为空
- 不自动发送API请求

#### 验证机制
```javascript
const validateParams = (params) => {
  // 时间验证
  if (!params.startDate || !params.endDate) {
    message.warning(t('analysis.pleaseSelectDateRange'));
    return false;
  }
  
  // 筛选条件验证  
  if (!params.customerCode && !params.productModel) {
    message.warning(t('analysis.pleaseSelectAtLeastOneFilter'));
    return false;
  }
  
  return true;
};
```

#### 智能提示
- 未选择时间: "请选择时间区间"
- 未选择筛选条件: "请至少选择一个筛选条件"
- 无数据导出: "暂无数据可导出"

## 导出功能

### 基础导出
```
POST /api/export/analysis
Request Body:
{
  "analysisData": {
    "sales_amount": 150000.00,
    "cost_amount": 120000.00,
    "profit_amount": 30000.00,
    "profit_rate": 20.00
  },
  "detailData": [...],
  "conditions": {
    "start_date": "2025-01-01",
    "end_date": "2025-01-31",
    "customer_name": "经销商A",
    "product_model": "iPhone 15"
  }
}

Response: Excel文件流
```

### 高级导出
```
POST /api/export/analysis/advanced
Request Body:
{
  "exportType": "by_customer", // 或 "by_product"
  "startDate": "2025-01-01",
  "endDate": "2025-01-31"
}

Response: 多工作表Excel文件
```

#### 导出模式
- **按客户分类**: 每个客户独立工作表，包含该客户所有产品明细
- **按产品分类**: 每个产品独立工作表，包含该产品所有客户明细

#### Excel模板
- `analysis_customer_summary`: 客户汇总模板
- `analysis_customer_detail`: 客户产品明细模板  
- `analysis_product_summary`: 产品汇总模板
- `analysis_product_detail`: 产品客户明细模板

## 性能优化

### 前端优化
- **智能API调用**: 避免无效请求
- **前端验证**: 完整输入验证
- **组件复用**: 模块化组件设计
- **状态管理**: 自定义钩子集中管理

### 后端优化
- **缓存优先**: 优先读取缓存数据
- **批量查询**: 减少数据库查询次数
- **精确计算**: 使用decimal.js确保精度
- **自动清理**: 定期清理过期缓存

### 代码优化成果
- **代码量**: 从572行减少到130行(77%减少)
- **组件数**: 拆分为6个独立组件
- **可维护性**: 单一职责，功能明确
- **可复用性**: 组件和钩子可复用

---

*本文档最后更新: 2025年8月*
