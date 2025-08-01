# 项目开发说明（ask-llm专用）

本文件用于辅助LLM理解本项目结构、API、数据库设计和核心业务逻辑，便于自动化代码生成和智能对话开发。

---

## 一、项目结构

- **backend/**
  - `server.js`：Express服务器入口
  - `db.js`：SQLite数据库连接和操作
  - `routes/`：API路由模块（如inbound、outbound、stock、partners、products、productPrices、receivable、payable等）
    - `export.js`：Node.js原生Excel导出API（基础信息、入库出库、应收应付）
    - `receivable.js`：应收账款管理API（实时聚合、回款记录CRUD）
    - `payable.js`：应付账款管理API（实时聚合、付款记录CRUD）
  - `utils/`：数据库结构、测试数据、库存等工具
    - `excelExporter.js`：Excel导出核心类（Node.js + xlsx实现）
    - `exportTemplates.js`：Excel导出模板定义
    - `exportQueries.js`：导出数据查询模块
    - `decimalCalculator.js`：**decimal.js 精确计算工具类**（解决浮点数精度问题，用于所有金额、价格、余额计算）
    - `logger.js`：Winston日志配置文件
    - `loggerMiddleware.js`：日志中间件（请求日志、错误日志）
- **frontend/**
  - `index.html`、`vite.config.js`、`src/`（App.jsx、main.jsx、pages/等）
  - `src/pages/`：页面组件
    - `Receivable/`：应收账款管理页面目录
      - `index.jsx`：主页面，表格和逻辑
      - `components/ReceivableTable.jsx`：表格展示
      - `components/ReceivableModal.jsx`：新增/编辑回款弹窗
    - `Payable/`：应付账款管理页面目录
      - `index.jsx`：主页面，表格和逻辑
      - `components/PayableTable.jsx`：表格展示
      - `components/PayableModal.jsx`：新增/编辑付款弹窗
    - `Inbound/`：入库管理页面目录
      - `index.jsx`：主入库组件
      - `components/InboundFilter.jsx`：筛选器组件
      - `components/InboundTable.jsx`：表格组件
      - `components/InboundModal.jsx`：弹窗表单组件
    - `Outbound/`：出库管理页面目录
      - `index.jsx`：主出库组件
      - `components/OutboundFilter.jsx`：筛选器组件
      - `components/OutboundTable.jsx`：表格组件
      - `components/OutboundModal.jsx`：弹窗表单组件
    - `Overview.jsx`：总览调试页
    - `Stock.jsx`：库存明细页
    - `Partners.jsx`：客户/供应商管理页
    - `Products.jsx`：产品管理页
    - `ProductPrices.jsx`：产品价格管理页
- 根目录：`package.json`、`README.md`、`ask-llm.md`（本文件）
- **data/**：数据存储目录
  - `log/`：日志文件目录（生产环境）
    - `app.log`：应用主日志
    - `error.log`：错误日志
    - `access.log`：HTTP访问日志
  - `data.db` SQLite 数据库文件

---

## 二、数据库设计

### 1. 入库记录表 inbound_records
| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 入库单号 |
| supplier_code | TEXT | 供应商代号 |
| supplier_short_name | TEXT | 供应商简称 |
| supplier_full_name | TEXT | 供应商全称 |
| product_code | TEXT | 产品代号 |
| product_model | TEXT | 产品型号 |
| quantity | INTEGER | 数量 |
| unit_price | REAL | 单价 |
| total_price | REAL | 总价（自动计算） |
| inbound_date | TEXT | 入库时间 |
| invoice_date | TEXT | 开票日期 |
| invoice_number | TEXT | 发票号码 |
| invoice_image_url | TEXT | 发票图片链接 |
| order_number | TEXT | 订单号 |
| remark | TEXT | 备注 |

### 2. 出库记录表 outbound_records
| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 出库单号 |
| customer_code | TEXT | 客户代号 |
| customer_short_name | TEXT | 客户简称 |
| customer_full_name | TEXT | 客户全称 |
| product_code | TEXT | 产品代号 |
| product_model | TEXT | 产品型号 |
| quantity | INTEGER | 数量 |
| unit_price | REAL | 单价 |
| total_price | REAL | 总价（自动计算） |
| outbound_date | TEXT | 出库时间 |
| invoice_date | TEXT | 开票日期 |
| invoice_number | TEXT | 发票号码 |
| invoice_image_url | TEXT | 发票图片链接 |
| order_number | TEXT | 订单号 |
| remark | TEXT | 备注 |

### 3. 库存缓存文件 stock-summary.json
**说明**：移除库存表，改用JSON文件存储每个产品的当前库存总量，通过入库/出库记录异步计算生成

**文件位置**：`/data/stock-summary.json`

**数据结构**：
```json
{
  "last_updated": "2025-07-24T10:30:00.000Z",
  "products": {
    "产品型号A": {
      "current_stock": 100,
      "last_inbound": "2025-07-20",
      "last_outbound": "2025-07-22"
    },
    "产品型号B": {
      "current_stock": -5,
      "last_inbound": "2025-07-15",
      "last_outbound": "2025-07-23"
    }
  }
}
```

### 4. 客户/供应商表 partners
| 字段 | 类型 | 说明 |
|---|---|---|
| code | TEXT UNIQUE | 代号（唯一） |
| short_name | TEXT PRIMARY KEY | 简称（唯一） |
| full_name | TEXT | 全称 |
| address | TEXT | 地址 |
| contact_person | TEXT | 联系人 |
| contact_phone | TEXT | 联系电话 |
| type | INTEGER | 0=供应商，1=客户 |

### 5. 产品表 products
| 字段 | 类型 | 说明 |
|---|---|---|
| code | TEXT UNIQUE | 代号（唯一） |
| category | TEXT | 产品类别 |
| product_model | TEXT | 产品型号 |
| remark | TEXT | 备注 |

### 6. 产品价格表 product_prices
| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 唯一标识 |
| partner_short_name | TEXT | 供应商/客户简称 |
| product_model | TEXT | 产品型号 |
| effective_date | TEXT | 生效日期 |
| unit_price | REAL | 单价 |

### 7. 产品类型表 product_categories
| 字段 | 类型 | 说明 |
|---|---|---|
| name | TEXT PRIMARY KEY | 产品类型名称 |

### 8. 回款记录表 receivable_payments
| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 唯一标识 |
| customer_code | TEXT | 客户代号 |
| amount | REAL | 回款金额 |
| pay_date | TEXT | 回款日期 |
| pay_method | TEXT | 回款方式 |
| remark | TEXT | 备注 |

### 9. 付款记录表 payable_payments
| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 唯一标识 |
| supplier_code | TEXT | 供应商代号 |
| amount | REAL | 付款金额 |
| pay_date | TEXT | 付款日期 |
| pay_method | TEXT | 付款方式 |
| remark | TEXT | 备注 |

---

## 三、API接口（RESTful）

- 统一前缀：`/api/`
- 主要接口：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /api/inbound | 获取入库记录列表（分页/筛选） |
| POST | /api/inbound | 新增入库记录 |
| PUT | /api/inbound/:id | 修改入库记录 |
| DELETE | /api/inbound/:id | 删除入库记录 |
| GET | /api/outbound | 获取出库记录列表（分页/筛选） |
| POST | /api/outbound | 新增出库记录 |
| PUT | /api/outbound/:id | 修改出库记录 |
| DELETE | /api/outbound/:id | 删除出库记录 |
| GET | /api/stock | 获取库存明细（读取缓存文件，支持产品筛选分页） |
| POST | /api/stock/refresh | 重新计算并刷新库存缓存（基于入库/出库记录重新计算所有产品库存） |
| GET | /api/partners | 获取客户/供应商列表 |
| POST | /api/partners | 新增客户/供应商 |
| PUT | /api/partners/:short_name | 修改客户/供应商 |
| DELETE | /api/partners/:short_name | 删除客户/供应商 |
| GET | /api/products | 获取产品列表 |
| POST | /api/products | 新增产品 |
| PUT | /api/products/:short_name | 修改产品 |
| DELETE | /api/products/:short_name | 删除产品 |
| GET | /api/product-prices | 获取产品价格列表 |
| GET | /api/product-prices/current | 获取当前有效价格 |
| POST | /api/product-prices | 新增产品价格 |
| PUT | /api/product-prices/:id | 修改产品价格 |
| DELETE | /api/product-prices/:id | 删除产品价格 |
| GET | /api/product-prices/auto | 自动获取产品单价（参数：partner_short_name, product_model, date，返回匹配的单价） |
| POST | /api/export/base-info | Node.js Excel导出基础信息（客户/供应商、产品、产品价格），直接返回Excel文件流 |
| POST | /api/export/inbound-outbound | Node.js Excel导出入库出库记录（支持日期、产品代号、客户代号筛选），直接返回Excel文件流 |
| POST | /api/export/receivable-payable | Node.js Excel导出应收应付明细，直接返回Excel文件流 |
| GET | /api/product-categories | 获取所有产品类型 |
| POST | /api/product-categories | 新增产品类型（仅后端维护） |
| DELETE | /api/product-categories/:name | 删除产品类型（仅后端维护） |
| POST | /api/stock-rebuild/rebuild | **已废弃** - 改用 POST /api/stock/refresh |
| GET | /api/receivable | 获取应收账款列表（分页/筛选/排序） |
| POST | /api/receivable/payments | 新增回款记录 |
| PUT | /api/receivable/payments/:id | 修改回款记录 |
| DELETE | /api/receivable/payments/:id | 删除回款记录 |
| GET | /api/receivable/details/:customer_code | 获取客户应收账款详情 |
| GET | /api/payable | 获取应付账款列表（分页/筛选/排序） |
| POST | /api/payable/payments | 新增付款记录 |
| PUT | /api/payable/payments/:id | 修改付款记录 |
| DELETE | /api/payable/payments/:id | 删除付款记录 |
| GET | /api/payable/details/:supplier_code | 获取供应商应付账款详情 |
| GET | /api/overview/stats | 获取系统统计数据（**纯读取overview-stats.json缓存文件**，包含总体数据、缺货产品明细字段 out_of_stock_products，无任何计算逻辑） |
| POST | /api/overview/stats | 强制刷新统计数据，**执行所有概览相关计算并写入缓存**，包括销售额分布、库存状态、所有产品本月变化量等，返回最新统计数据 |

#### GET /api/overview/stats 返回字段 out_of_stock_products

| 字段 | 类型 | 说明 |
|---|---|---|
| out_of_stock_products | Array | 缺货产品明细，数组元素为 `{ product_model: string }` |

示例：
```json
{
  ...,
  "out_of_stock_products": [
    { "product_model": "iPhone 15 Pro" },
    { "product_model": "MacBook Pro M3" }
  ]
}
```
| GET | /api/overview/monthly-stock-change/:productModel | 获取指定产品的本月库存变化量（简化版本，参数：产品型号productModel，返回月初库存、当前库存、本月变化量，移除额外的统计信息以减少计算量） |
| GET | /api/overview/top-sales-products | 获取销售额前10的商品及“其他”合计（返回格式：[{ product_model, total_sales }...]，最后一项为“其他”合计，**只读overview-stats.json缓存，避免每次请求实时计算**） |

---


## 四、核心业务逻辑

## 四、核心业务逻辑

### 概览页数据缓存机制（重点说明）

**严格的缓存分离架构**：
- **POST 刷新机制**：所有概览统计数据的计算**仅在 POST /api/overview/stats 时执行**，包括：
  - 系统总览统计（销售额、采购额、客户供应商数量等）
  - 缺货产品列表
  - 销售额前10商品分布及"其他"合计
  - **所有产品的本月库存变化量**（预计算所有产品，避免单独查询）
- **JSON 缓存存储**：计算结果统一写入 `/data/overview-stats.json` 缓存文件，包含以下结构：
  ```json
  {
    "overview": { /* 总览统计 */ },
    "out_of_stock_products": [ /* 缺货产品 */ ],
    "top_sales_products": [ /* 销售额前10及其他 */ ],
    "monthly_stock_changes": { 
      "产品型号A": { /* 本月库存变化详情 */ },
      "产品型号B": { /* 本月库存变化详情 */ }
    }
  }
  ```
- **GET 纯读取**：所有 GET 接口（`/api/overview/stats`、`/api/overview/top-sales-products`、`/api/overview/monthly-stock-change/:productModel`）**严格只读取 JSON 缓存文件**，无任何数据库查询和计算逻辑
- **性能优势**：前端页面响应毫秒级，避免复杂聚合查询阻塞系统

**数据更新流程**：
1. 数据变更后（入库、出库、基础数据修改），调用 POST /api/overview/stats 刷新
2. 后端执行所有统计计算，写入 overview-stats.json
3. 前端 GET 请求直接返回缓存数据，无计算延迟

- **价格管理**：产品价格按生效日期管理，查询时取最近有效价格。
- **库存管理**：入库增加库存，出库减少库存，允许库存为负（前端警告）。**库存数据存储在JSON缓存文件中，通过刷新按钮异步重新计算**。
- **数据唯一性**：客户/供应商、产品的"代号-简称-全称"三项强绑定，任意一项变更自动同步，后端API校验唯一性。
- **自动计算**：总价自动计算，进出库自动更新库存。
- **智能输入**：入库/出库界面支持代号或简称/型号输入，自动补全匹配项，强绑定校验，使用AutoComplete组件提供流畅的输入体验。
- **精确计算**：**全面使用 decimal.js 进行浮点数精确计算**，解决 JavaScript 原生浮点数精度问题，确保所有金额、价格、余额计算的准确性。

---

## 五、前端页面结构

### 页面组织结构
- **总览调试页**：数据库总览、测试数据
- **入库管理页**：代号-简称强绑定AutoComplete输入，支持筛选和数据导出
- **出库管理页**：代号-简称强绑定AutoComplete输入，支持筛选和数据导出
- **库存明细页**：库存查询与统计，**移除库存历史记录功能**，**添加库存刷新功能**
- **客户/供应商管理页**：代号-简称-全称三项联动
- **产品管理页**：代号-简称-型号三项联动
- **产品价格管理页**：价格历史管理
- **应收账款管理页**：实时聚合应收账款、回款记录管理
- **应付账款管理页**：实时聚合应付账款、付款记录管理

### 组件化架构
**应收账款管理 (`pages/Receivable/`)**
- `index.jsx` - 主页面，负责状态管理和业务逻辑
- `components/ReceivableTable.jsx` - 表格组件（展示、详情、操作）
- `components/ReceivableModal.jsx` - 弹窗表单组件（新增/编辑回款记录）

**应付账款管理 (`pages/Payable/`)**
- `index.jsx` - 主页面，负责状态管理和业务逻辑
- `components/PayableTable.jsx` - 表格组件（展示、详情、操作）
- `components/PayableModal.jsx` - 弹窗表单组件（新增/编辑付款记录）

**入库管理 (`pages/Inbound/`)**
- `index.jsx` - 主入库组件，负责状态管理和业务逻辑
- `components/InboundFilter.jsx` - 筛选器组件（供应商、产品、日期范围）
- `components/InboundTable.jsx` - 表格组件（展示、编辑、删除操作）
- `components/InboundModal.jsx` - 弹窗表单组件（新增/编辑入库记录）

**出库管理 (`pages/Outbound/`)**
- `index.jsx` - 主出库组件，负责状态管理和业务逻辑
- `components/OutboundFilter.jsx` - 筛选器组件（客户、产品、日期范围）
- `components/OutboundTable.jsx` - 表格组件（展示、编辑、删除操作）
- `components/OutboundModal.jsx` - 弹窗表单组件（新增/编辑出库记录）

### 组件设计原则
- **单一职责**：每个组件只负责一个特定功能
- **Props传递**：父组件管理状态，子组件通过props接收数据和回调
- **业务逻辑集中**：主要业务逻辑集中在index.jsx中，组件只负责UI展示
- **可复用性**：组件设计考虑复用性，便于维护和扩展

---

## 六、开发建议

### 导出功能架构
- **Node.js原生导出**：使用xlsx库实现Excel导出，内存操作，无临时文件，响应速度快（<50ms）
- **直接下载模式**：前端fetch请求 → 后端生成Excel Buffer → 前端blob下载，一步到位
- **多表导出支持**：
  - 基础信息导出：客户/供应商、产品、产品价格（支持选择性导出）
  - 入库出库记录：支持日期、产品、客户筛选，分别或同时导出
  - 应收应付明细：包含汇总、明细、回款/付款记录多个工作表
- **技术优势**：
  - ✅ 纯Node.js实现，无Python依赖
  - ✅ 内存导出，零磁盘占用  
  - ✅ 即时响应，无需等待文件生成
  - ✅ 支持并发导出请求
  - ✅ Excel格式完全兼容

### 代码组织
- **API优先**：前后端分离，所有业务逻辑在后端实现
- **组件化开发**：复杂页面拆分为独立组件，提高代码可维护性
- **状态管理**：主组件负责状态管理，子组件通过props接收数据
- **模块化设计**：代码模块化、注释清晰，便于团队协作

### 组件拆分策略
1. **筛选器组件**：独立的筛选条件输入组件
2. **表格组件**：数据展示和操作的表格组件
3. **弹窗组件**：新增/编辑的表单弹窗组件
4. **主组件**：负责数据获取、状态管理和业务逻辑

### 开发优先级
- 先实现核心功能，再扩展高级特性
- 测试用例覆盖所有接口
- 响应式设计，适配不同屏幕尺寸
- 错误处理和用户友好的提示信息

---

## 七、配置管理

### 统一配置架构
- **配置文件**：`frontend/src/config/appConfig.json` - 集中管理所有应用配置项
- **导出模块**：`frontend/src/config/index.js` - 提供便捷的配置导入和工具函数

### 配置项说明

#### 付款/回款方式配置 (`paymentMethods`)
```json
{
  "paymentMethods": {
    "list": ["现金", "银行转账", "支票", "银行承兑汇票", "商业承兑汇票", "支付宝", "微信支付", "其他"],
    "default": "银行转账",
    "config": {
      "cash": { "label": "现金", "code": "CASH" },
      "bank_transfer": { "label": "银行转账", "code": "BANK_TRANSFER" }
    }
  }
}
```

#### 产品类别配置 (`productCategories`)
```json
{
  "productCategories": {
    "list": ["电子产品", "机械设备", "办公用品", "原材料", "化工产品", "其他"],
    "default": "其他"
  }
}
```

### 配置使用方式
```javascript
// 导入配置
import { PAYMENT_METHODS, PRODUCT_CATEGORIES, DEFAULT_PAYMENT_METHOD } from '../config';

// 使用工具函数
import { getPaymentMethodOptions, getProductCategoryOptions } from '../config';
```

### 扩展性
- **导出格式**：支持Excel、CSV等多种格式
- **导出范围**：支持全量导出和条件筛选
- **导出模式**：支持实时导出和后台任务
- **文件管理**：自动生成时间戳文件名，避免冲突

### 维护说明
- **添加新配置**：直接在 `appConfig.json` 中添加配置项
- **修改生效**：修改配置文件后重启应用即可生效
- **版本控制**：配置变更可通过Git跟踪，便于团队协作
- **扩展性**：支持添加更多配置项，如系统设置、UI主题等

---

## 八、日志管理

### 日志架构
- **日志库**：Winston - 企业级日志管理，支持多种传输方式和格式
- **环境区分**：开发环境仅控制台输出，生产环境写入文件
- **日志目录**：`/data/log/` - 集中存储所有日志文件

### 日志文件说明
| 文件名 | 说明 | 级别 | 大小限制 | 文件数 |
|---|---|---|---|---|
| `app.log` | 应用主日志（包含所有info及以上级别） | info+ | 10MB | 10个 |
| `error.log` | 错误日志（仅错误信息） | error | 10MB | 10个 |
| `access.log` | HTTP访问日志（请求/响应记录） | info | 10MB | 10个 |

### 日志格式
- **JSON格式**：结构化日志，便于分析和监控
- **时间戳**：YYYY-MM-DD HH:mm:ss 格式
- **服务标识**：myf-db-system
- **自动轮转**：文件大小达到10MB自动轮转，保留10个历史文件

### 日志内容
#### 应用日志 (app.log)
- 服务器启动/关闭
- 数据库操作
- API请求处理
- 业务逻辑执行

#### 错误日志 (error.log)
- API错误详情
- 数据库错误
- 未捕获异常
- 系统错误

#### 访问日志 (access.log)
- HTTP请求方法、URL、IP
- 响应状态码、处理时间
- 用户代理信息

### 日志工具命令
```bash
# 查看应用日志
npm run logs:view

# 查看错误日志  
npm run logs:error

# 查看访问日志
npm run logs:access

# 清理日志文件
npm run clean:logs
```

### 开发建议
- **业务代码集成**：在关键业务节点使用 `logger.info()`, `logger.error()` 记录日志
- **错误处理**：统一错误处理中间件自动记录错误日志
- **性能监控**：记录API响应时间，便于性能分析
- **安全审计**：记录敏感操作，如数据修改、删除等

### 生产环境部署
- **日志目录权限**：确保应用有 `/data/log/` 目录的读写权限
- **日志监控**：建议配置日志监控工具监控错误日志
- **定期清理**：根据存储空间定期清理旧日志文件
- **备份策略**：重要日志文件可配置备份策略

---

## 九、精确计算架构（decimal.js）

### 浮点数精度问题解决方案

**问题背景**：
- JavaScript 原生浮点数运算存在精度问题（如 `0.1 + 0.2 = 0.30000000000000004`）
- 财务系统对计算精度要求极高，浮点数误差会导致账务不平衡
- 原项目使用 `Math.round((quantity * unit_price) * 100) / 100` 方法仍存在精度隐患

**解决方案**：
- **全面集成 decimal.js**：高精度小数运算库，避免浮点数精度问题
- **统一计算接口**：创建 `decimalCalculator.js` 工具类，封装所有数值计算逻辑
- **后端全覆盖**：所有涉及金额、价格、余额的计算均使用 decimal.js

### decimal.js 工具类核心功能

**文件位置**：`backend/utils/decimalCalculator.js`

**精度升级**：
- **升级时间**：2025年8月（最新）
- **精度等级**：从 2-4 位小数升级到 5 位小数（0.00001 级别）
- **升级原因**：支持更高精度的商品单价和复杂计算场景
- **兼容性**：向前兼容，现有数据无需迁移

**主要方法**：
```javascript
// 基础运算
decimalCalc.add(a, b)           // 加法
decimalCalc.subtract(a, b)      // 减法  
decimalCalc.multiply(a, b)      // 乘法
decimalCalc.divide(a, b)        // 除法

// 业务计算
decimalCalc.calculateTotalPrice(quantity, unitPrice)    // 总价计算
decimalCalc.calculateBalance(totalAmount, paidAmount)   // 余额计算  
decimalCalc.calculateProfit(sales, cost)               // 利润计算
decimalCalc.calculateWeightedAverage(items)            // 加权平均

// 数据转换
decimalCalc.fromSqlResult(sqlResult, defaultValue, decimalPlaces)  // SQL结果处理
decimalCalc.toDbNumber(value, decimalPlaces)                       // 数据库存储格式
decimalCalc.batchCalculateTotalPrice(records)                      // 批量计算
```

### 升级覆盖范围

**1. 入库/出库记录**
- `routes/inbound.js`：总价计算 `quantity × unit_price`
- `routes/outbound.js`：总价计算 `quantity × unit_price`
- 替换：`Math.round((quantity * unit_price) * 100) / 100` → `decimalCalc.calculateTotalPrice(quantity, unit_price)`

**2. 应收/应付账款**
- `routes/receivable.js`：余额计算 `total_receivable - total_paid`
- `routes/payable.js`：余额计算 `total_payable - total_paid`
- 应用层重新计算，确保精度

**3. 概览统计计算**
- `routes/overview.js`：
  - 已售商品成本计算（加权平均成本法）
  - 销售额/采购额聚合计算
  - 利润率计算
  - 销售额前10商品统计及"其他"合计
  - 本月库存变化量计算

**4. 导出查询模块**
- `utils/exportQueries.js`：应收/应付汇总余额计算
- `utils/reportService.js`：财务报表利润和现金流计算

**5. 数据库升级工具**
- `utils/dbUpgrade.js`：历史数据迁移时的计算修正

### 精度配置

**decimal.js 配置**：
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

**数据精度标准**：
- **金额/价格**：保留 5 位小数（如：1234.56789）- 支持 0.00001 级别精度
- **单价**：保留 5 位小数（如：0.12345）- 高精度单价支持
- **数量**：保留 0 位小数（整数）
- **百分比**：保留 1 位小数（如：12.3%）
- **加权平均**：保留 5 位小数 - 确保价格计算精确性

### 测试验证

**测试文件**：
- `backend/test-decimal.js`：基础计算功能测试
- `backend/test-precision-5digits.js`：高精度计算测试（0.00001级别精度验证）
- `backend/test-sales-precision.js`：销售额精度测试

**测试覆盖**：
- 基础四则运算精度验证
- 总价计算对比（原生 JS vs decimal.js）
- 余额计算精度测试（5位小数）
- 加权平均价格计算（高精度）
- SQL结果处理和批量计算
- 浮点数精度问题修复验证
- 0.00001 级别的边界精度测试
- 高精度单价和总价计算验证

### 性能影响

**性能考虑**：
- decimal.js 相比原生运算略有性能开销
- 通过合理的缓存和批量处理优化性能
- 对于财务系统，精度比性能更重要
- 实际使用中性能影响可忽略不计

**优化策略**：
- 在数据库存储前转换为原生数字类型
- 批量计算时复用 Decimal 实例
- 避免频繁的字符串/数字转换

### 开发建议

**新增计算逻辑**：
```javascript
// ❌ 避免使用原生运算
const result = price * quantity + tax;

// ✅ 使用 decimal.js 工具
const result = decimalCalc.add(
  decimalCalc.multiply(price, quantity), 
  tax
);
```

**数据库操作**：
```javascript
// 存储前转换
const dbValue = decimalCalc.toDbNumber(calculatedValue, 2);

// 读取后处理
const safeValue = decimalCalc.fromSqlResult(row.amount, 0, 2);
```

**API 返回**：
- 所有金额字段都经过 decimal.js 处理
- 确保前端接收到的数据精度正确
- 避免在前端进行精度敏感的计算

---

> 本文件为LLM/AI开发辅助文档，便于理解项目结构、API和业务规则，适合自动化代码生成和智能对话。
> 
> **重要更新**：项目已全面完成 decimal.js 精确计算升级（2025年8月），解决了所有浮点数精度问题，确保财务数据的准确性。所有金额、价格、余额相关计算均使用高精度算法。
