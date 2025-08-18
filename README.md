# MyF Lightweight ERP System

一个专为小型企业设计的轻量级企业资源规划(ERP)系统，基于React、Node.js和SQLite构建。

## 🚀 主要功能

- **库存管理**: 跟踪库存水平、入库和出库操作
- **产品管理**: 管理产品信息和定价策略
- **财务跟踪**: 监控应付账款和应收账款
- **销售分析**: 生成报表和分析销售数据
- **多语言支持**: 支持英语、韩语和中文
- **数据导出**: 支持Excel格式数据导出
- **JWT认证**: 无状态身份验证系统

## 🛠 技术栈

- **前端**: React 18, Vite, Ant Design
- **后端**: Node.js, Express, SQLite3
- **认证**: JWT无状态认证
- **样式**: CSS3, Ant Design组件库
- **日志**: Winston日志系统
- **精确计算**: Decimal.js精确数值计算

## ⚡ 快速开始

### 环境要求

- Node.js 18+ 
- npm 或 yarn

### 安装步骤

1. **克隆项目**:
```bash
git clone <repository-url>
cd myf-lightweight-ERP-system
```

2. **安装依赖**:
```bash
# 安装后端依赖
cd backend
npm install

# 安装前端依赖
cd ../frontend
npm install
```

3. **设置配置**:
```bash
# 复制示例配置文件
cp -r config-example/* data/
```

4. **初始化数据库**:
```bash
cd backend
npm run init-db
```

5. **启动开发服务器**:
```bash
# 启动后端服务 (在backend目录)
npm run dev

# 启动前端服务 (在frontend目录，新开终端)
cd ../frontend
npm run dev
```

应用程序将在以下地址可用:
- 前端: http://localhost:5173
- 后端API: http://localhost:3000

## 📁 项目结构

```
myf-lightweight-ERP-system/
├── backend/          # Node.js后端服务器
│   ├── routes/       # API路由
│   └── utils/        # 工具函数和中间件
├── frontend/         # React前端应用
│   ├── src/          # 源代码
│   └── public/       # 静态资源
├── data/            # 数据库和配置文件
├── config-example/  # 示例配置文件
└── docs/           # 项目文档
```

## 📚 文档

完整的项目文档可在 `docs/` 目录中找到:

- **[开发文档总览](docs/README-DEV.md)** - 开发者文档导航和快速入门
- **[项目架构](docs/project-structure.md)** - 技术栈、目录结构和配置管理
- **[数据库设计](docs/database-design.md)** - 数据模型、表结构和关系
- **[API接口文档](docs/api-reference.md)** - REST API接口完整文档
- **[认证系统](docs/authentication.md)** - JWT认证架构和安全机制
- **[精确计算](docs/decimal-calculation.md)** - 财务数值精确计算架构
- **[业务逻辑](docs/business-logic.md)** - 核心业务规则和算法
- **[前端组件](docs/frontend-components.md)** - React组件设计和开发规范
- **[数据分析](docs/analysis-features.md)** - 销售分析功能和算法
- **[数据导出](docs/export-features.md)** - Excel导出功能和模板系统
- **[日志管理](docs/logging.md)** - 日志记录和监控系统
- **[开发工具](docs/development-tools.md)** - 开发环境和工作流程

## ⚙️ 配置管理

系统使用位于 `data/` 目录中的JSON配置文件:

- `appConfig.json`: 应用设置和公司信息
- `exportConfig.json`: 数据导出模板和设置
- `data.db`: SQLite数据库文件

## 🔧 开发工作流

### 创建新功能
```bash
# 创建特性分支
git checkout -b feature/new-feature-name

# 提交更改
git commit -m "feat: add new feature description"

# 推送分支
git push origin feature/new-feature-name
```

### 代码质量检查
```bash
# 运行代码检查
npm run lint

# 运行测试
npm run test

# 构建项目
npm run build
```

## 🤝 参与贡献

1. Fork 项目仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开 Pull Request

## 📄 许可证

本项目基于 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🆕 最新更新 (2025年8月)

- ✅ 完整的JWT认证系统
- ✅ 模块化文档架构
- ✅ 精确的财务计算系统
- ✅ 全面的API文档
- ✅ 组件化前端架构
- ✅ 完善的日志管理系统

---

💡 **开发者提示**: 开始开发前请阅读 [开发文档总览](docs/README-DEV.md) 获取完整的开发指南。

---

## 🔧 设计考虑

### 项目范围
本项目专为小型贸易公司设计。入库和出库产品被视为相同产品，不进行分别管理。

### 性能特性
本项目默认使用 Node.js + SQLite，仅支持低并发场景。对于大规模并发需求，请适配其他数据库并配置Nginx层。

---

## 💡 智能特性

- **代号-简称强绑定**: 在入库/出库页面，可输入代号或简称，系统自动匹配补全
- **三向联动验证**: 客户/供应商的代号-简称-全称和产品的代号-简称-型号强关联，确保数据一致性
- **自动计算**: 根据历史数据自动填充价格，更新库存水平
- **状态可视化**: 付款/收款状态指示器，进度跟踪
- **批量导入导出**: 支持Excel等格式的批量数据处理

---

## 📊 数据分析特性

- **多维度分析**: 支持按时间段、客户、产品等维度数据分析
- **财务指标**: 自动计算销售收入、成本、利润和利润率
- **详细分析表**: 选择特定客户时显示该客户各产品销售明细，选择特定产品时显示该产品各客户销售明细
- **智能显示逻辑**: 只有销售收入大于零的记录才会在详细表格中显示
- **缓存优化**: 使用缓存机制提升查询性能，自动清理30天以上过期缓存
- **灵活筛选**: 支持全部客户/产品分析或特定客户/产品分析
- **实时刷新**: 支持手动刷新重新计算最新数据

---

## 🔒 安全与认证

本系统实现了完整的JWT认证机制：

- **无状态认证**: 基于JWT token的无状态身份验证
- **安全中间件**: 统一的认证中间件保护API端点
- **错误处理**: 完善的认证错误处理和用户友好提示
- **前端集成**: React钩子集成认证状态管理

详细认证文档请参考 [认证系统](docs/authentication.md)。

---

*本文档最后更新: 2025年8月*