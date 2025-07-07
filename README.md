# 小型公司进出货 + 账务系统

一个专为小型企业设计的轻量级库存管理和账务系统，基于现代Web技术栈构建，提供完整的进出货管理、库存跟踪和财务报表功能。

---

## 🚀 快速上手

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

- 前端开发服务器: http://localhost:5173
- 后端API服务器: http://localhost:3000
- 生产环境: http://localhost:3000

---

## 📦 功能特性

- **智能入库/出库管理**：支持代号-简称强绑定输入，自动补全与匹配，自动更新库存
- **客户/供应商管理**：代号-简称-全称三项联动，强绑定校验，避免数据冗余
- **产品管理**：代号-简称-型号三项联动，支持产品分类与价格管理
- **财务自动计算**：应付/应收金额自动计算，支持部分付款/回款跟踪
- **智能表单体验**：AutoComplete组件，输入任意项自动补全其他项，流畅操作
- **数据导出与报表**：库存明细、进出货记录、收支统计等多维度报表
- **一键测试数据**：快速生成示例数据，API调试支持
- **响应式设计**：适配桌面和移动设备，现代化UI体验

---

## 🏗 技术架构

- 前端：React 18 + Ant Design 5 + Vite + dayjs
- 后端：Node.js 18+ + Express + SQLite + CORS

---

## 📁 目录结构

```
myf-db-systool/
├── backend/         # 后端服务
│   ├── server.js    # 服务器入口
│   ├── db.js        # 数据库连接
│   ├── routes/      # API路由
│   └── utils/       # 工具函数
├── frontend/        # 前端应用
│   ├── index.html   # 应用入口
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       └── pages/   # 页面组件
├── package.json     # 项目配置
├── README.md        # 项目说明
└── ask-llm.md       # LLM开发辅助文档
```

---

## 📋 使用指南

### 1. 初始化数据
- 访问 http://localhost:5173
- 进入“总览调试”页面，点击“设置测试数据”按钮
- 系统自动生成示例数据

### 2. 基础数据设置
- 客户/供应商管理：添加合作伙伴信息
- 产品管理：添加产品信息
- 产品价格管理：设置产品价格

### 3. 业务操作
- 入库/出库：记录采购和销售
- 库存查看：监控库存状况
- 报表导出：生成业务报表

### 4. 智能功能
- **代号-简称强绑定输入**：入库/出库界面支持输入代号或简称，自动补全匹配项
- **三项联动校验**：客户/供应商、产品的代号-简称-全称/型号强绑定，确保数据一致性
- **自动价格与金额计算**：根据历史价格自动填充，库存自动更新
- **状态可视化**：付款/回款状态标识，进度跟踪
- **批量导入/导出**：支持Excel等格式的数据批量处理

---

## 🔧 常用开发命令

### 根目录
```bash
npm run install:all   # 安装所有依赖
npm run dev           # 启动开发环境
npm run build:prod    # 构建生产版本
npm run start:prod    # 启动生产环境
npm run clean         # 清理构建文件
npm run lint          # 代码检查
```

### 前端独立命令
```bash
cd frontend
npm run dev           # 启动前端开发服务器
npm run build         # 构建前端
npm run preview       # 预览构建结果
npm run lint:fix      # 自动修复代码格式
```

### 后端独立命令
```bash
cd backend
npm start             # 启动生产服务器
npm run dev           # 启动开发服务器
npm run dev:debug     # 启动调试模式
npm run db:init       # 初始化数据库
npm run db:seed       # 填充测试数据
```

---

## 📊 数据库核心表

- **inbound_records**：入库记录（含supplier_code、product_code字段）
- **outbound_records**：出库记录（含customer_code、product_code字段）
- **stock**：库存明细（基于product_model跟踪）
- **partners**：客户/供应商（代号-简称-全称强绑定）
- **products**：产品信息（代号-简称-型号强绑定）
- **product_prices**：产品价格（按日期管理）
- **product_categories**：产品类型

---

## 🔄 主要API接口

- 详见 `ask-llm.md` 文档，或参考 `/backend/routes/` 目录源码

---

## 🎨 用户界面

- **Ant Design风格**：现代化UI设计，响应式布局
- **智能表单**：AutoComplete组件实现代号-简称强绑定输入，流畅操作体验
- **数据表格**：支持分页、排序、筛选、批量操作
- **状态标识**：可视化付款/回款状态，操作反馈
- **移动端适配**：支持桌面和移动设备访问

---

## 🧪 测试与调试

- 一键生成测试数据，API接口可用Postman/curl测试
- 浏览器开发者工具、React DevTools
- 后端调试模式：`npm run dev:debug`

---

## 📈 性能与扩展

- 前端代码分割、懒加载、缓存优化
- 后端分页查询、索引优化
- 支持文件上传、Excel导入导出、权限管理等扩展

---

## 🤝 贡献与支持

- Fork、分支开发、Pull Request
- 代码规范：ESLint + Prettier
- 问题反馈：Issue 或联系维护者

---

**🎯 本系统专为小型企业设计，简单易用，功能完整，开箱即用！**
