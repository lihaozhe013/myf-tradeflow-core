# 项目结构与配置

## 技术栈

- **后端**: Node.js + Express + SQLite
- **前端**: React + Vite + Ant Design
- **认证**: JWT无状态认证
- **计算**: decimal.js 精确计算
- **日志**: Winston 企业级日志
- **导出**: xlsx Node.js原生Excel导出

## 项目目录结构

```
myf-tradeflow-system/
├── backend/                 # 后端服务
│   ├── server.js           # Express服务器入口
│   ├── db.js               # SQLite数据库连接
│   ├── package.json        # 后端依赖
│   ├── routes/             # API路由模块
│   │   ├── inbound.js      # 入库管理API
│   │   ├── outbound.js     # 出库管理API
│   │   ├── stock.js        # 库存管理API
│   │   ├── partners.js     # 客户供应商API
│   │   ├── products.js     # 产品管理API
│   │   ├── productPrices.js # 产品价格API
│   │   ├── receivable.js   # 应收账款API
│   │   ├── payable.js      # 应付账款API
│   │   ├── overview.js     # 概览统计API
│   │   ├── about.js        # 系统信息API
│   │   ├── analysis/       # 数据分析模块
│   │   │   └── analysis.js # 数据分析API
│   │   └── export/         # 导出功能模块
│   │       └── index.js    # 导出API入口
│   └── utils/              # 工具模块
│       ├── dbSchema.js     # 数据库结构
│       ├── dbUpgrade.js    # 数据库升级
│       ├── decimalCalculator.js # 精确计算
│       ├── logger.js       # 日志配置
│       ├── loggerMiddleware.js # 日志中间件
│       └── stockCacheService.js # 库存缓存
├── frontend/               # 前端应用
│   ├── index.html          # 入口HTML
│   ├── package.json        # 前端依赖
│   ├── vite.config.js      # Vite配置
│   ├── eslint.config.js    # ESLint配置
│   └── src/                # 源代码
│       ├── App.jsx         # 主应用组件
│       ├── main.jsx        # 入口文件
│       ├── App.css         # 全局样式
│       ├── index.css       # 基础样式
│       ├── auth/           # 认证模块
│       │   ├── AuthContext.jsx # 认证上下文
│       │   └── auth.js     # 认证工具
│       ├── hooks/          # 自定义钩子
│       │   ├── useApi.js   # API请求钩子
│       │   ├── useSimpleApi.js # 简化API钩子
│       │   └── index.js    # 钩子统一导出
│       ├── utils/          # 工具函数
│       │   └── request.js  # 请求工具
│       ├── config/         # 配置管理
│       │   ├── appConfig.json # 应用配置
│       │   └── index.js    # 配置导出
│       ├── i18n/           # 国际化
│       │   ├── index.js    # i18n配置
│       │   └── locales/    # 语言包
│       └── pages/          # 页面组件
│           ├── Overview.jsx # 总览页
│           ├── Stock.jsx   # 库存页
│           ├── Partners.jsx # 客户供应商
│           ├── Products.jsx # 产品管理
│           ├── ProductPrices.jsx # 产品价格
│           ├── About.jsx   # 关于页面
│           ├── Overview/   # 总览模块
│           ├── Inbound/    # 入库模块
│           ├── Outbound/   # 出库模块
│           ├── Receivable/ # 应收账款
│           ├── Payable/    # 应付账款
│           ├── Analysis/   # 数据分析
│           └── Report/     # 报表模块
├── data/                   # 数据存储
│   ├── data.db            # SQLite数据库
│   ├── appConfig.json     # 运行时配置
│   ├── exportConfig.json  # 导出配置
│   ├── overview-stats.json # 概览统计缓存
│   ├── stock-summary.json # 库存汇总缓存
│   ├── analysis-cache.json # 分析数据缓存
│   └── log/               # 日志目录
│       ├── app.log        # 应用日志
│       ├── error.log      # 错误日志
│       └── access.log     # 访问日志
├── config-example/         # 配置示例
├── docs/                  # 文档目录
├── package.json           # 项目依赖
└── README.md             # 项目说明
```

## 配置管理

### 统一配置架构

**配置文件层级**:
1. `frontend/src/config/appConfig.json` - 前端应用配置
2. `data/appConfig.json` - 运行时配置
3. `data/exportConfig.json` - 导出功能配置
4. `config-example/` - 配置示例目录

### 核心配置项

#### 付款方式配置
```json
{
  "paymentMethods": {
    "list": ["现金", "银行转账", "支票", "银行承兑汇票", "其他"],
    "default": "银行转账"
  }
}
```

#### 产品类别配置
```json
{
  "productCategories": {
    "list": ["电子产品", "机械设备", "办公用品", "其他"],
    "default": "其他"
  }
}
```

#### 导出配置
```json
{
  "exportTemplates": {
    "baseInfo": {
      "enabled": true,
      "sheets": ["partners", "products", "productPrices"]
    },
    "records": {
      "enabled": true,
      "dateFormat": "YYYY-MM-DD"
    }
  }
}
```

### 配置使用方式

```javascript
// 前端配置导入
import { PAYMENT_METHODS, PRODUCT_CATEGORIES } from '../config';

// 工具函数使用
import { getPaymentMethodOptions } from '../config';
```

## 核心依赖

### 后端依赖
- `express`: Web框架
- `sqlite3`: SQLite数据库
- `jsonwebtoken`: JWT认证
- `argon2`: 密码加密
- `decimal.js`: 精确计算
- `winston`: 日志管理
- `xlsx`: Excel导出
- `multer`: 文件上传

### 前端依赖  
- `react`: UI框架
- `antd`: UI组件库
- `react-i18next`: 国际化
- `recharts`: 图表组件
- `vite`: 构建工具

## 运行环境

### 开发环境
- Node.js 16+
- npm 8+
- 端口配置:
  - 后端: 3000
  - 前端: 5173

### 生产环境
- 支持Docker部署
- 支持PM2进程管理
- 支持反向代理(Nginx)

## 环境变量

```bash
# 开发环境
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
LOG_LEVEL=debug

# 生产环境  
NODE_ENV=production
PORT=3000
JWT_SECRET=your-production-secret
LOG_LEVEL=info
```

## 启动方式

### 开发模式
```bash
# 安装依赖
npm install

# 启动开发服务器(前后端同时启动)
npm run dev

# 单独启动后端
cd backend && npm start

# 单独启动前端  
cd frontend && npm run dev
```

### 生产模式
```bash
# 构建前端
cd frontend && npm run build

# 启动生产服务器
npm start
```

---

*本文档最后更新: 2025年8月*
