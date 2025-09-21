# 数据导出功能

## 功能概述

数据导出模块支持将系统中的各类数据导出为Excel文件，包括基础数据导出和分析数据导出。所有导出文件使用统一的模板格式和多语言支持。

## 导出类型

### 基础数据导出
- **库存总览**: 当前库存状态和产品信息
- **入库记录**: 采购和入库明细数据
- **出库记录**: 销售和出库明细数据
- **应付账款**: 供应商往来账务信息
- **应收账款**: 客户往来账务信息
- **发票记录**: 发票开具和管理信息

### 分析数据导出
- **基础分析**: 销售分析汇总数据
- **高级分析**: 按客户或产品分类的详细分析

## 导出架构

### 目录结构
```
backend/routes/export/
├── index.js                    # 导出路由入口
└── utils/
    ├── index.js               # 工具入口文件
    ├── exportModules.js       # 核心导出逻辑
    ├── exportTemplates.js     # Excel模板配置
    ├── exportUtils.js         # 通用工具函数
    ├── excelExporter.js       # Excel文件生成器
    ├── basicDataQueries.js    # 基础数据查询
    ├── analysisQueries.js     # 分析数据查询
    ├── analysisExporter.js    # 分析数据导出
    ├── advancedAnalysisExporter.js # 高级分析导出
    ├── baseInfoExporter.js    # 基础信息导出
    ├── financialExporter.js   # 财务数据导出
    ├── invoiceExporter.js     # 发票数据导出
    ├── transactionExporter.js # 交易记录导出
    ├── invoiceQueries.js      # 发票查询逻辑
    ├── payableQueries.js      # 应付查询逻辑
    ├── receivableQueries.js   # 应收查询逻辑
    └── transactionQueries.js  # 交易查询逻辑
```

### 核心组件

#### 导出模块 (exportModules.js)
```javascript
const exportModules = {
  // 基础数据导出
  stock: require('./baseInfoExporter').exportStock,
  inbound: require('./transactionExporter').exportInbound,
  outbound: require('./transactionExporter').exportOutbound,
  payable: require('./financialExporter').exportPayable,
  receivable: require('./financialExporter').exportReceivable,
  invoice: require('./invoiceExporter').exportInvoice,
  
  // 分析数据导出
  analysis: require('./analysisExporter').exportAnalysis,
  analysisAdvanced: require('./advancedAnalysisExporter').exportAdvanced
};
```

#### Excel生成器 (excelExporter.js)
```javascript
const generateExcel = (templateConfig, data, options = {}) => {
  const workbook = new ExcelJS.Workbook();
  
  // 设置工作簿属性
  workbook.creator = 'MYF TradeFlow System';
  workbook.created = new Date();
  
  // 创建工作表
  const worksheet = workbook.addWorksheet(templateConfig.sheetName);
  
  // 应用样式和格式
  applyTemplateStyles(worksheet, templateConfig);
  
  // 填充数据
  fillWorksheetData(worksheet, templateConfig, data);
  
  return workbook;
};
```

## Excel模板配置

### 模板结构
```javascript
const template = {
  // 基本信息
  templateName: 'stock_summary',
  sheetName: '库存总览',
  
  // 表头配置
  headers: [
    { key: 'product_model', label: '产品型号', width: 20 },
    { key: 'current_stock', label: '当前库存', width: 15, type: 'number' },
    { key: 'avg_cost', label: '平均成本', width: 15, type: 'currency' }
  ],
  
  // 样式配置
  headerStyle: {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF366092' } },
    alignment: { horizontal: 'center', vertical: 'middle' }
  },
  
  // 数据样式
  dataStyle: {
    alignment: { horizontal: 'left', vertical: 'middle' },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  }
};
```

### 支持的模板类型

#### 基础数据模板
- `stock_summary`: 库存总览模板
- `inbound_records`: 入库记录模板
- `outbound_records`: 出库记录模板
- `payable_summary`: 应付账款模板
- `receivable_summary`: 应收账款模板
- `invoice_records`: 发票记录模板

#### 分析数据模板
- `analysis_customer_summary`: 客户汇总分析模板
- `analysis_customer_detail`: 客户产品明细模板
- `analysis_product_summary`: 产品汇总分析模板
- `analysis_product_detail`: 产品客户明细模板

### 字段类型支持
```javascript
const fieldTypes = {
  text: (value) => value || '',
  number: (value) => parseFloat(value) || 0,
  currency: (value) => {
    const num = parseFloat(value) || 0;
    return { richText: [{ text: num.toFixed(2) }] };
  },
  date: (value) => value ? new Date(value) : '',
  percent: (value) => {
    const num = parseFloat(value) || 0;
    return num / 100; // Excel将自动格式化为百分比
  }
};
```

## API接口

### 基础数据导出
```
POST /api/export/{type}
支持的type: stock, inbound, outbound, payable, receivable, invoice

Request Body (可选筛选条件):
{
  "filters": {
    "date_range": ["2025-01-01", "2025-01-31"],
    "customer_code": "C001",
    "product_model": "iPhone"
  }
}

Response: Excel文件流
Headers:
- Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
- Content-Disposition: attachment; filename="库存总览_20250118.xlsx"
```

### 分析数据导出
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

### 高级分析导出
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

## 查询逻辑

### 基础数据查询
```javascript
// 库存查询
const getStockData = () => {
  const query = `
    SELECT 
      p.product_model,
      COALESCE(stock.current_stock, 0) as current_stock,
      COALESCE(cost.avg_cost, 0) as avg_cost,
      p.selling_price
    FROM products p
    LEFT JOIN stock_summary stock ON p.product_model = stock.product_model
    LEFT JOIN (
      SELECT 
        product_model,
        SUM(quantity * unit_price) / SUM(quantity) as avg_cost
      FROM inbound_records 
      GROUP BY product_model
    ) cost ON p.product_model = cost.product_model
    ORDER BY p.product_model
  `;
  return db.prepare(query).all();
};
```

### 交易记录查询
```javascript
// 带筛选条件的查询
const getTransactionData = (type, filters = {}) => {
  let query = `SELECT * FROM ${type}_records WHERE 1=1`;
  const params = [];
  
  // 时间筛选
  if (filters.date_range) {
    query += ` AND date BETWEEN ? AND ?`;
    params.push(filters.date_range[0], filters.date_range[1]);
  }
  
  // 客户/供应商筛选
  if (filters.customer_code) {
    query += ` AND customer_code = ?`;
    params.push(filters.customer_code);
  }
  
  // 产品筛选
  if (filters.product_model) {
    query += ` AND product_model LIKE ?`;
    params.push(`%${filters.product_model}%`);
  }
  
  query += ` ORDER BY date DESC, id DESC`;
  return db.prepare(query).all(params);
};
```

### 财务数据查询
```javascript
// 应付/应收账款查询
const getFinancialData = (type, filters = {}) => {
  const isPayable = type === 'payable';
  const tableName = isPayable ? 'payable_records' : 'receivable_records';
  const partnerField = isPayable ? 'supplier_code' : 'customer_code';
  
  const query = `
    SELECT 
      ${partnerField} as partner_code,
      SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as total_amount,
      SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as paid_amount,
      SUM(amount) as balance_amount,
      COUNT(*) as record_count,
      MAX(date) as latest_date
    FROM ${tableName}
    WHERE 1=1 ${filters.partner_code ? `AND ${partnerField} = ?` : ''}
    GROUP BY ${partnerField}
    HAVING SUM(amount) != 0
    ORDER BY balance_amount DESC
  `;
  
  const params = filters.partner_code ? [filters.partner_code] : [];
  return db.prepare(query).all(params);
};
```

## 文件生成流程

### 标准导出流程
```javascript
const exportData = async (type, filters = {}) => {
  try {
    // 1. 获取模板配置
    const template = getTemplate(type);
    
    // 2. 查询数据
    const data = await queryData(type, filters);
    
    // 3. 数据预处理
    const processedData = preprocessData(data, template);
    
    // 4. 生成Excel文件
    const workbook = generateExcel(template, processedData);
    
    // 5. 返回文件流
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
    
  } catch (error) {
    logger.error(`Export ${type} failed:`, error);
    throw new Error(`导出失败: ${error.message}`);
  }
};
```

### 高级分析导出流程
```javascript
const exportAdvancedAnalysis = async (params) => {
  const { exportType, startDate, endDate } = params;
  
  // 1. 创建多工作表工作簿
  const workbook = new ExcelJS.Workbook();
  
  if (exportType === 'by_customer') {
    // 按客户导出
    const customers = await getCustomerList();
    
    for (const customer of customers) {
      // 为每个客户创建工作表
      const customerData = await getCustomerAnalysis(customer.code, startDate, endDate);
      const worksheet = workbook.addWorksheet(customer.short_name);
      
      // 填充客户分析数据
      fillCustomerAnalysisData(worksheet, customerData);
    }
  } else {
    // 按产品导出
    const products = await getProductList();
    
    for (const product of products) {
      // 为每个产品创建工作表
      const productData = await getProductAnalysis(product.model, startDate, endDate);
      const worksheet = workbook.addWorksheet(product.model);
      
      // 填充产品分析数据
      fillProductAnalysisData(worksheet, productData);
    }
  }
  
  return await workbook.xlsx.writeBuffer();
};
```

## 样式和格式化

### 表头样式
```javascript
const headerStyle = {
  font: { 
    bold: true, 
    color: { argb: 'FFFFFFFF' },
    size: 12 
  },
  fill: { 
    type: 'pattern', 
    pattern: 'solid', 
    fgColor: { argb: 'FF366092' } 
  },
  alignment: { 
    horizontal: 'center', 
    vertical: 'middle' 
  },
  border: {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  }
};
```

### 数据格式化
```javascript
const formatCellValue = (value, type) => {
  switch (type) {
    case 'currency':
      return {
        value: parseFloat(value) || 0,
        numFmt: '#,##0.00'
      };
    case 'percent':
      return {
        value: (parseFloat(value) || 0) / 100,
        numFmt: '0.00%'
      };
    case 'date':
      return {
        value: value ? new Date(value) : '',
        numFmt: 'yyyy-mm-dd'
      };
    default:
      return { value: value || '' };
  }
};
```

### 条件格式化
```javascript
// 库存预警格式化
const applyStockWarning = (worksheet, stockColumn) => {
  worksheet.addConditionalFormatting({
    ref: stockColumn,
    rules: [
      {
        type: 'cellIs',
        operator: 'lessThan',
        formulae: [10],
        style: {
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } },
          font: { color: { argb: 'FFFFFFFF' } }
        }
      }
    ]
  });
};
```

## 错误处理

### 导出异常处理
```javascript
const handleExportError = (error, type) => {
  logger.error(`Export ${type} failed:`, {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });
  
  // 根据错误类型返回不同的错误信息
  if (error.code === 'ENOENT') {
    throw new Error('模板文件不存在');
  } else if (error.message.includes('database')) {
    throw new Error('数据库查询失败，请稍后重试');
  } else {
    throw new Error('导出失败，请联系管理员');
  }
};
```

### 数据验证
```javascript
const validateExportData = (data, type) => {
  if (!data || data.length === 0) {
    throw new Error('没有可导出的数据');
  }
  
  // 特定类型的验证
  if (type === 'analysis' && !data.sales_amount) {
    throw new Error('分析数据不完整');
  }
  
  return true;
};
```

## 性能优化

### 内存管理
- **流式处理**: 大数据量时使用流式写入
- **分批处理**: 超过10000条记录时分批处理
- **内存释放**: 及时释放工作簿对象

### 查询优化
- **索引利用**: 优化查询使用数据库索引
- **分页查询**: 大数据量时分页获取
- **连接查询**: 减少多次查询的网络开销

### 缓存策略
- **模板缓存**: 缓存常用Excel模板配置
- **数据缓存**: 短期缓存查询结果
- **文件缓存**: 临时缓存生成的文件

---

*本文档最后更新: 2025年8月*
