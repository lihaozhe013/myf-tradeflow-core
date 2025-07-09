# 项目开发说明（ask-llm专用）

本文件用于辅助LLM理解本项目结构、API、数据库设计和核心业务逻辑，便于自动化代码生成和智能对话开发。

---

## 一、项目结构

- **backend/**
  - `server.js`：Express服务器入口
  - `db.js`：SQLite数据库连接和操作
  - `routes/`：API路由模块（如inbound、outbound、stock、partners、products、productPrices、reports、receivable、payable等）
    - `reports.js`：报表生成API（实时聚合、数据查询）
    - `export.js`：Python导出脚本调用API（基础信息、入库出库、应收应付）
    - `receivable.js`：应收账款管理API（实时聚合、回款记录CRUD）
    - `payable.js`：应付账款管理API（实时聚合、付款记录CRUD）
  - `utils/`：数据库结构、测试数据、报表、库存等工具
    - `pythonExporter.js`：Python导出脚本调用工具类
  - `python_scripts/`：Python导出脚本目录
    - `export/`：重构后的导出脚本（支持命令行和Node.js集成）
      - `base-info.py`：基础信息导出（客户/供应商、产品、产品价格）
      - `inbound-outbound.py`：入库出库记录导出
      - `receivable-payable.py`：应收应付明细导出
    - `export-*.py`：原始交互式导出脚本（保留）
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
    - `Report.jsx`：报表导出页
      - 支持原有的在线报表查看和简单导出功能
      - 新增Python导出功能：基础信息、入库出库记录、应收应付明细
      - 双模式设计：报表查看模式 + 高级导出模式
- 根目录：`package.json`、`README.md`、`ask-llm.md`（本文件）

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

### 3. 库存表 stock
| 字段 | 类型 | 说明 |
|---|---|---|
| record_id | INTEGER | 记录编号（与进/出库记录id一致） |
| product_model | TEXT | 产品型号 |
| stock_quantity | INTEGER | 操作后库存数量 |
| update_time | TEXT | 更新时间 |

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
| GET | /api/stock | 获取库存明细 |
| GET | /api/stock/history | 获取库存历史记录 |
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
| GET | /api/report/stock | 导出库存明细报表 |
| GET | /api/report/inout | 导出进出货明细报表 |
| GET | /api/report/finance | 导出收支统计报表 |
| POST | /api/export/base-info | Python导出基础信息（客户/供应商、产品、产品价格） |
| POST | /api/export/inbound-outbound | Python导出入库出库记录 |
| POST | /api/export/receivable-payable | Python导出应收应付明细 |
| GET | /api/product-categories | 获取所有产品类型 |
| POST | /api/product-categories | 新增产品类型（仅后端维护） |
| DELETE | /api/product-categories/:name | 删除产品类型（仅后端维护） |
| POST | /api/stock-rebuild/rebuild | 重建库存表（清空后根据入库/出库记录重新汇总，耗时操作，需前端确认） |
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

---

## 四、核心业务逻辑

- **价格管理**：产品价格按生效日期管理，查询时取最近有效价格。
- **库存管理**：入库增加库存，出库减少库存，允许库存为负（前端警告）。
- **数据唯一性**：客户/供应商、产品的"代号-简称-全称"三项强绑定，任意一项变更自动同步，后端API校验唯一性。
- **自动计算**：总价自动计算，进出库自动更新库存。
- **智能输入**：入库/出库界面支持代号或简称/型号输入，自动补全匹配项，强绑定校验，使用AutoComplete组件提供流畅的输入体验。

---

## 五、前端页面结构

### 页面组织结构
- **总览调试页**：数据库总览、测试数据
- **入库管理页**：代号-简称强绑定AutoComplete输入
- **出库管理页**：代号-简称强绑定AutoComplete输入
- **库存明细页**：库存查询与统计
- **客户/供应商管理页**：代号-简称-全称三项联动
- **产品管理页**：代号-简称-型号三项联动
- **产品价格管理页**：价格历史管理
- **应收账款管理页**：实时聚合应收账款、回款记录管理
- **应付账款管理页**：实时聚合应付账款、付款记录管理
- **报表导出页**：各类报表生成和Python导出功能集成

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
- **双模式导出系统**：
  - 在线报表查看：适合快速查看和轻量级导出
  - Python导出：适合大数据量和复杂格式的导出
- **Python脚本集成**：
  - 交互式脚本：手动执行，适合运维人员
  - 命令行接口：支持参数传递，适合自动化
  - Node.js集成：前端按钮直接调用，用户体验优化

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

> 本文件为LLM/AI开发辅助文档，便于理解项目结构、API和业务规则，适合自动化代码生成和智能对话。
