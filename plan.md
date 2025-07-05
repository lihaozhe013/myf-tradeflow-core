# **小型公司进出货 + 账务系统开发方案**

## 一、系统目标

构建一个适用于小型企业的轻量级业务系统，涵盖商品管理、库存记录、进出账记录，并可导出简单报表。前端简洁，后端稳定，数据可迁移，部署简单。

## 二、技术选型

| 层级 | 技术 | 理由 |
| :---- | :---- | :---- |
| 前端 | React + Ant Design + Vite | 快速开发，组件丰富 |
| 后端 | Node.js + Express | 轻量、扩展性好 |
| 数据库 | SQLite | 易迁移、配置零成本 |

**重要原则：SQL中只存放数据，不实现任何逻辑，不需要写任何Trigger！所有的逻辑都由后端/前端完成！！本项目是可维护性和简易性优先，不用考虑性能！！**

## 三、数据库设计

### 1. 入库记录表 (inbound_records)

| 字段名 | 数据类型 | 备注 |
| :---- | :---- | :---- |
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 入库单号，唯一标识符 |
| supplier_short_name | TEXT | 供应商简称 |
| supplier_full_name | TEXT | 供应商全称 |
| product_model | TEXT | 产品型号 |
| quantity | INTEGER | 数量 |
| unit_price | REAL | 单价（根据时间自动计算或手动填写） |
| total_price | REAL | 总价，数量 * 单价 自动计算 |
| inbound_date | TEXT | 入库时间（YYYY-MM-DD） |
| invoice_date | TEXT | 开票日期（可为空） |
| invoice_number | TEXT | 发票号码（可为空） |
| invoice_image_url | TEXT | 发票图片链接（可为空） |
| order_number | TEXT | 订单号（关联采购订单，可为空） |
| payment_date | TEXT | 付款日期（可为空） |
| payment_amount | REAL | 付款金额（实际支付给供应商的金额） |
| payable_amount | REAL | 应付金额，total_price - payment_amount |
| payment_method | TEXT | 付款形式（如：银行转账、现金等） |
| remark | TEXT | 备注 |

### 2. 出库记录表 (outbound_records)

| 字段名 | 数据类型 | 备注 |
| :---- | :---- | :---- |
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 发货单号，唯一标识符 |
| customer_short_name | TEXT | 客户简称 |
| customer_full_name | TEXT | 客户全称 |
| product_model | TEXT | 产品型号 |
| quantity | INTEGER | 数量 |
| unit_price | REAL | 单价（根据时间自动计算或手动填写） |
| total_price | REAL | 总价，数量 * 单价 自动计算 |
| outbound_date | TEXT | 出库时间（YYYY-MM-DD） |
| invoice_date | TEXT | 开票日期（可为空） |
| invoice_number | TEXT | 发票号码（可为空） |
| invoice_image_url | TEXT | 发票图片链接（可为空） |
| order_number | TEXT | 订单号（关联销售订单，可为空） |
| collection_date | TEXT | 回款日期（可为空） |
| collection_amount | REAL | 回款金额（客户实际支付的金额） |
| receivable_amount | REAL | 应收金额，total_price - collection_amount |
| collection_method | TEXT | 回款形式（如：银行转账、现金、微信支付等） |
| remark | TEXT | 备注 |

### 3. 库存管理表 (stock)

| 字段名 | 数据类型 | 备注 |
| :---- | :---- | :---- |
| record_id | INTEGER | 记录编号（与进/出库记录表id一致） |
| product_model | TEXT | 产品型号 |
| stock_quantity | INTEGER | 每次操作后的库存数量 |
| update_time | TEXT | 更新时间（YYYY-MM-DD HH:mm:ss） |

### 4. 客户/供应商管理表 (partners)

| 字段名 | 数据类型 | 备注 |
| :---- | :---- | :---- |
| code | TEXT UNIQUE | 代号（如字母，唯一，可用于快速输入检索） |
| short_name | TEXT PRIMARY KEY | 简称（唯一） |
| full_name | TEXT | 全称 |
| address | TEXT | 地址 |
| contact_person | TEXT | 联系人 |
| contact_phone | TEXT | 联系电话 |
| type | INTEGER | 类型（0=供应商，1=客户） |

### 5. 产品管理表 (products)

| 字段名 | 数据类型 | 备注 |
| :---- | :---- | :---- |
| code | TEXT UNIQUE | 代号（如字母，唯一，可用于快速输入检索） |
| short_name | TEXT PRIMARY KEY | 简称（唯一） |
| category | TEXT | 产品类别 |
| product_model | TEXT | 产品型号 |
| remark | TEXT | 备注 |

### 6. 产品价格管理表 (product_prices)

| 字段名 | 数据类型 | 备注 |
| :---- | :---- | :---- |
| id | INTEGER PRIMARY KEY AUTOINCREMENT | 唯一标识 |
| partner_short_name | TEXT | 供应商/客户简称 |
| product_model | TEXT | 产品型号 |
| effective_date | TEXT | 生效时间（YYYY-MM-DD） |
| unit_price | REAL | 单价 |

### 7. 产品类型表 (product_categories)
| 字段名 | 数据类型 | 备注 |
| :---- | :---- | :---- |
| name | TEXT PRIMARY KEY | 产品类型名称（唯一）|

## 四、API接口设计（REST API）

### 调试接口
| 方法 | 路径 | 说明 |
| :---- | :---- | :---- |
| POST | /api/debug/setup-test-data | 设置测试数据 |
| GET | /api/debug/all-tables | 获取所有表数据（调试用） |

### 核心业务接口
| 方法 | 路径 | 说明 |
| :---- | :---- | :---- |
| GET | /api/inbound | 获取入库记录列表（支持分页、筛选） |
| POST | /api/inbound | 新增入库记录 |
| PUT | /api/inbound/:id | 修改入库记录 |
| DELETE | /api/inbound/:id | 删除入库记录 |
| GET | /api/outbound | 获取出库记录列表（支持分页、筛选） |
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
| GET | /api/report/stock | 导出库存明细报表 |
| GET | /api/report/inout | 导出进出货明细报表 |
| GET | /api/report/finance | 导出收支统计报表 |
| GET | /api/product-categories | 获取所有产品类型 |
| DELETE | /api/product-categories/:name | 删除产品类型（仅后端维护）|

## 五、前端页面结构

### 页面清单
- **总览调试页** - 数据库表格总览和测试数据设置（开发调试用）
- **入库管理页** - 入库记录的增删查改
- **出库管理页** - 出库记录的增删查改
- **库存明细页** - 库存查看和历史记录
- **客户/供应商管理页** - 合作伙伴信息维护，支持“代号-简称-全称”三者联动输入，任意输入一项可自动补全其余两项，基于 Antd 可输入下拉菜单实现
- **产品管理页** - 产品信息维护，支持“代号-简称-型号”三者联动输入，任意输入一项可自动补全其余两项，基于 Antd 可输入下拉菜单实现
- **产品价格管理页** - 基于日期的价格管理
- **报表导出页** - 三类报表的查看和导出

### 核心功能要求
1. **自动价格计算** - 选择供应商/客户和产品时，自动获取当前有效价格
2. **自动金额计算** - 数量×单价=总价，总价-已付/已收=应付/应收
3. **库存自动更新** - 入库/出库操作自动更新库存数量
4. **状态标识** - 付款/回款状态的可视化标识
5. **数据验证** - 表单验证和错误提示
6. **响应式设计** - 适配不同屏幕尺寸

### 产品管理页面
- 产品分类下拉框支持快速搜索、输入和新增，所有分类由后端API动态提供
- 产品类型表仅后端维护，前端不直接暴露管理入口

## 六、业务逻辑规则

### 1. 价格管理规则
- 产品价格按生效日期管理，查询时取最近的有效价格
- 入库/出库时可自动获取价格，也可手动修改
- 价格精度支持到小数点后4位

### 2. 库存管理规则
- 入库操作：库存数量增加
- 出库操作：库存数量减少
- 库存历史：记录每次操作后的库存状态
- 库存不能为负数（前端警告，但允许操作）

### 3. 财务管理规则
- 应付金额 = 总价 - 已付金额
- 应收金额 = 总价 - 已收金额
- 支持部分付款/回款
- 财务报表按日期统计收支和利润

### 4. 数据关联规则
- 客户/供应商通过简称关联
- 产品通过型号关联
- 价格通过合作伙伴简称+产品型号+日期确定

## 七、开发实现要点

### 1. 后端实现
- **模块化设计** - 路由、控制器、服务分离
- **错误处理** - 统一的错误响应格式
- **数据验证** - 请求参数验证
- **自动计算** - 总价、应付/应收金额的自动计算
- **库存更新** - 进出库操作的库存同步

### 2. 前端实现
- **组件化** - 可复用的表格、表单、模态框组件
- **状态管理** - 页面状态和数据管理
- **表单处理** - 自动填充、实时计算、验证
- **用户体验** - 加载状态、错误提示、成功反馈
- **数据展示** - 分页、筛选、排序功能

### 3. 数据库操作
- **CRUD操作** - 标准的增删查改
- **关联查询** - 多表联合查询
- **分页查询** - 大数据量的分页处理
- **条件筛选** - 多条件组合查询
- **报表统计** - 聚合查询和分组统计

## 八、部署方案

### 开发环境
- 前端：http://localhost:5173 (Vite开发服务器)
- 后端：http://localhost:3000 (Express服务器)
- 数据库：SQLite文件 (backend/data.db)

### 生产环境
- 前端构建后集成到后端
- 单端口访问：http://localhost:3000
- 数据库文件可直接备份迁移

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0
- 现代浏览器支持

## 九、扩展规划

### 近期扩展
- 文件上传功能（发票图片）
- 数据导入导出（Excel格式）
- 用户权限管理
- 操作日志记录

### 中期扩展
- 移动端适配
- 多公司支持
- 高级报表功能
- 数据分析图表

### 长期扩展
- 云端部署
- 多用户协作
- API开放平台
- 第三方集成

## 十、开发指导

### 适合LLM开发的特点
1. **需求明确** - 每个模块功能清晰定义
2. **技术栈统一** - 使用主流技术，文档丰富
3. **接口标准** - RESTful API设计规范
4. **数据结构简单** - 关系清晰，易于理解
5. **业务逻辑明确** - 计算规则和流程清楚

### 开发建议
1. **分模块开发** - 按功能模块逐步实现
2. **先后端后前端** - API先行，前端调用
3. **测试驱动** - 每个接口都要有测试用例
4. **文档同步** - 代码和文档保持一致
5. **渐进增强** - 先实现核心功能，再添加高级特性

这个方案为小型企业提供了一个完整、实用的进出货管理解决方案，适合结合LLM进行快速开发和迭代。

### 8. 代号-简称-全称强绑定功能
- 在客户/供应商管理和产品管理页面，新增/编辑时自动校验三项绑定唯一性，无需单独设置绑定弹窗。

