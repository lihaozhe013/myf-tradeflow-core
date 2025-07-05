# 小型公司进出货 + 账务系统

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![Ant Design](https://img.shields.io/badge/Ant%20Design-5-blue.svg)

一个专为小型企业设计的轻量级库存管理和账务系统，基于现代Web技术栈构建，提供完整的进出货管理、库存跟踪和财务报表功能。

## 🌟 功能特性

### 📦 库存管理
- ✅ **入库管理** - 完整的采购入库流程，支持供应商管理和付款跟踪
- ✅ **出库管理** - 销售出库管理，支持客户管理和回款跟踪
- ✅ **库存明细** - 实时库存查看，支持历史记录和库存预警
- ✅ **自动更新** - 进出库操作自动更新库存数量

### 👥 基础数据管理
- ✅ **客户/供应商管理** - 统一的合作伙伴信息维护
- ✅ **产品管理** - 产品信息和分类管理
- ✅ **价格管理** - 基于日期的动态价格管理系统

### 💰 财务管理
- ✅ **自动计算** - 总价、应付/应收金额自动计算
- ✅ **付款跟踪** - 采购付款状态管理
- ✅ **回款跟踪** - 销售回款状态管理
- ✅ **财务报表** - 收支统计和利润分析

### 📊 报表系统
- ✅ **库存报表** - 当前库存状况总览
- ✅ **进出货报表** - 历史交易记录分析
- ✅ **财务报表** - 按期间统计收支和利润
- ✅ **数据导出** - 支持CSV格式导出

### 🛠 开发调试
- ✅ **总览调试页** - 数据库表格总览和测试数据
- ✅ **一键设置** - 快速生成测试数据
- ✅ **API测试** - 完整的接口测试支持

## 🏗 技术架构

### 前端技术栈
- **React 18** - 现代化的用户界面框架
- **Ant Design 5** - 企业级UI组件库
- **Vite** - 快速的前端构建工具
- **dayjs** - 轻量级日期处理库

### 后端技术栈
- **Node.js 18+** - 服务器运行环境
- **Express** - Web应用框架
- **SQLite** - 轻量级嵌入式数据库
- **CORS** - 跨域资源共享支持

### 项目结构
```
myf-db-systool/
├── 📁 backend/              # 后端服务
│   ├── 📄 server.js         # 服务器入口 (36行)
│   ├── 📄 db.js             # 数据库连接 (33行)
│   ├── 📁 routes/           # API路由模块
│   │   ├── 📄 debug.js      # 调试接口 (49行)
│   │   ├── 📄 inbound.js    # 入库管理 (172行)
│   │   ├── 📄 outbound.js   # 出库管理 (169行)
│   │   ├── 📄 stock.js      # 库存管理 (32行)
│   │   ├── 📄 partners.js   # 客户/供应商 (98行)
│   │   ├── 📄 products.js   # 产品管理 (90行)
│   │   ├── 📄 productPrices.js # 价格管理 (130行)
│   │   └── 📄 reports.js    # 报表生成 (44行)
│   └── 📁 utils/            # 工具函数
│       ├── 📄 dbSchema.js   # 数据库结构 (79行)
│       ├── 📄 setupTestData.js # 测试数据 (161行)
│       ├── 📄 stockService.js # 库存服务 (75行)
│       └── 📄 reportService.js # 报表服务 (153行)
├── 📁 frontend/             # 前端应用
│   ├── 📄 index.html        # 应用入口
│   ├── 📄 vite.config.js    # Vite配置
│   └── 📁 src/
│       ├── 📄 App.jsx       # 主应用组件
│       ├── 📄 main.jsx      # 应用启动文件
│       └── 📁 pages/        # 页面组件
│           ├── 📄 Overview.jsx    # 总览调试页
│           ├── 📄 Inbound.jsx     # 入库管理页
│           ├── 📄 Outbound.jsx    # 出库管理页
│           ├── 📄 Stock.jsx       # 库存明细页
│           ├── 📄 Partners.jsx    # 客户/供应商页
│           ├── 📄 Products.jsx    # 产品管理页
│           ├── 📄 ProductPrices.jsx # 价格管理页
│           └── 📄 Report.jsx      # 报表导出页
├── 📄 package.json          # 项目配置
├── 📄 README.md            # 项目说明
└── 📄 plan.md              # 开发方案
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0

### 一键安装和启动
```bash
# 克隆项目
git clone <repository-url>
cd myf-db-systool

# 安装所有依赖
npm run install:all

# 启动开发环境 (前端 + 后端)
npm run dev
```

### 访问地址
- **前端开发服务器**: http://localhost:5173
- **后端API服务器**: http://localhost:3000
- **生产环境**: http://localhost:3000

## 📋 使用指南

### 1. 初始化数据
首次使用时，建议先设置测试数据：
1. 访问 http://localhost:5173
2. 点击"总览调试"菜单
3. 点击"设置测试数据"按钮
4. 系统将自动创建示例数据

### 2. 基础数据设置
按以下顺序设置基础数据：
1. **客户/供应商管理** - 添加合作伙伴信息
2. **产品管理** - 添加产品信息
3. **产品价格管理** - 设置产品价格

### 3. 业务操作
1. **入库操作** - 记录采购入库
2. **出库操作** - 记录销售出库
3. **库存查看** - 监控库存状况
4. **报表导出** - 生成业务报表

### 4. 智能功能
- **自动价格填充** - 选择供应商和产品时自动获取价格
- **实时金额计算** - 自动计算总价和应付/应收金额
- **库存自动更新** - 进出库操作自动更新库存
- **状态可视化** - 付款/回款状态清晰显示

### 5. 代号-简称-全称强绑定
- 在客户/供应商管理和产品管理页面，用户在新增/编辑时自动校验三项绑定唯一性，无需单独设置绑定弹窗。
- 绑定后三者必须一一对应，任意一项变更自动同步，且不能与其他绑定冲突。
- 支持批量导入（如粘贴多行文本或上传CSV）和单条编辑。
- 后端API校验唯一性和一致性。

## 🔧 开发命令

### 根目录命令 (推荐)
```bash
# 🔧 安装所有依赖
npm run install:all

# 🚀 启动开发环境 (前端+后端)
npm run dev

# 🏗️ 构建生产版本
npm run build:prod

# ▶️ 启动生产环境
npm run start:prod

# 🧹 清理构建文件
npm run clean

# 📝 代码检查
npm run lint
```

### 前端独立命令
```bash
cd frontend

# 🚀 启动开发服务器
npm run dev

# 🏗️ 构建生产版本
npm run build

# 👀 预览构建结果
npm run preview

# 🔧 自动修复代码格式
npm run lint:fix
```

### 后端独立命令
```bash
cd backend

# ▶️ 启动生产服务器
npm start

# 🚀 启动开发服务器 (自动重启)
npm run dev

# 🐛 启动调试模式
npm run dev:debug

# 🗄️ 初始化数据库
npm run db:init

# 🌱 填充测试数据
npm run db:seed
```

## 📊 数据库设计

### 核心表结构
- **inbound_records** - 入库记录表 (17字段)
- **outbound_records** - 出库记录表 (17字段)
- **stock** - 库存明细表 (4字段)
- **partners** - 客户/供应商表 (7字段，含代号code)
- **products** - 产品信息表 (5字段，含代号code)
- **product_prices** - 产品价格表 (5字段)
- **product_categories** - 产品类型表 (1字段)

### 数据库结构
| 表名 | 字段 | 说明 |
| :---- | :---- | :---- |
| inbound_records | id, supplier_short_name, supplier_full_name, product_model, quantity, unit_price, total_price, inbound_date, invoice_date, invoice_number, invoice_image_url, order_number, payment_date, payment_amount, payable_amount, payment_method, remark | 入库记录 |
| outbound_records | id, customer_short_name, customer_full_name, product_model, quantity, unit_price, total_price, outbound_date, invoice_date, invoice_number, invoice_image_url, order_number, collection_date, collection_amount, receivable_amount, collection_method, remark | 出库记录 |
| stock | record_id, product_model, stock_quantity, update_time | 库存明细 |
| partners | code, short_name, full_name, address, contact_person, contact_phone, type | 客户/供应商（含代号code） |
| products | code, short_name, category, product_model, remark | 产品信息（含代号code） |
| product_prices | id, partner_short_name, product_model, effective_date, unit_price | 产品价格 |
| product_categories | name | 产品类型 |

### API接口
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
| POST | /api/product-categories | 新增产品类型（仅后端维护）|
| DELETE | /api/product-categories/:name | 删除产品类型（仅后端维护）|

## 🎨 用户界面

### 设计特色
- **Ant Design风格** - 专业的企业级UI
- **响应式设计** - 适配不同屏幕尺寸
- **直观操作** - 简洁明了的用户体验
- **状态反馈** - 清晰的操作状态提示

### 页面功能
- **智能表单** - 代号/简称/全称三项联动输入，任意输入一项可自动补全其余两项，基于 Antd 可输入下拉菜单实现
- **数据表格** - 支持排序、筛选、分页
- **状态标识** - 颜色编码的状态显示
- **批量操作** - 高效的数据处理

## 🔒 部署方案

### 开发环境
```bash
# 启动开发环境
npm run dev
# 前端: http://localhost:5173
# 后端: http://localhost:3000
```

### 生产环境
```bash
# 构建和启动生产环境
npm run build:prod
npm run start:prod
# 访问: http://localhost:3000
```

### 数据备份
```bash
# 备份数据库
cp backend/data.db backup/data-$(date +%Y%m%d).db

# 恢复数据库
cp backup/data-20240101.db backend/data.db
```

## 🧪 测试和调试

### 测试数据
- 访问总览调试页面
- 点击"设置测试数据"
- 系统自动创建完整的示例数据

### API测试
- 使用Postman或curl测试API
- 所有接口支持标准HTTP方法
- 详细的错误信息和状态码

### 调试工具
- 浏览器开发者工具
- React DevTools扩展
- 后端调试模式 (`npm run dev:debug`)

## 📈 性能优化

### 前端优化
- **代码分割** - 按需加载页面组件
- **缓存策略** - 智能的数据缓存
- **懒加载** - 大数据表格的虚拟滚动
- **压缩构建** - 生产环境代码压缩

### 后端优化
- **数据库索引** - 关键字段索引优化
- **查询优化** - 高效的SQL查询
- **分页查询** - 大数据量的分页处理
- **缓存机制** - 常用数据缓存

## 🔄 扩展功能

### 已实现功能
- ✅ 完整的CRUD操作
- ✅ 自动价格和金额计算
- ✅ 库存自动更新
- ✅ 三类业务报表
- ✅ 数据导出功能
- ✅ 响应式设计

### 计划功能
- 📋 文件上传 (发票图片)
- 📋 Excel导入导出
- 📋 用户权限管理
- 📋 操作日志记录
- 📋 移动端适配
- 📋 数据分析图表

## 🤝 贡献指南

### 开发流程
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

### 代码规范
- 使用ESLint进行代码检查
- 遵循Prettier格式化规范
- 编写清晰的注释和文档
- 保持代码模块化和可维护性

## 📄 许可证

本项目采用 ISC 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 支持

如有问题或建议，请：
1. 查看文档和FAQ
2. 搜索已有的Issues
3. 创建新的Issue
4. 联系项目维护者

---

**🎯 这是一个专为小型企业设计的现代化库存管理系统，简单易用，功能完整，开箱即用！**
