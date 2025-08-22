# 开发工具和工作流

## 开发环境设置

### 必需软件
- **Node.js**: v18+ (推荐使用LTS版本)
- **SQLite3**: 数据库支持
- **Git**: 版本控制
- **VS Code**: 推荐IDE (可选其他编辑器)

### 推荐VS Code扩展
- **ES7+ React/Redux/React-Native snippets**: React代码片段
- **Prettier**: 代码格式化
- **ESLint**: 代码质量检查
- **SQLite Viewer**: 数据库文件查看
- **Auto Rename Tag**: HTML/JSX标签重命名
- **Bracket Pair Colorizer**: 括号配对着色
- **Chinese Language Pack**: 中文语言包

## 项目设置

### 初始化步骤
```bash
# 1. 克隆项目
git clone <repository-url>
cd myf-lightweight-ERP-system

# 2. 安装后端依赖
cd backend
npm install

# 3. 安装前端依赖  
cd ../frontend
npm install

# 4. 复制配置文件
cd ..
cp -r config-example/* data/

# 5. 初始化数据库
cd backend
npm run init-db

# 6. 启动开发环境
npm run dev
```

### 环境变量配置
```bash
# backend/.env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-here
DB_PATH=../data/data.db
LOG_LEVEL=debug

# frontend/.env
VITE_API_BASE_URL=http://localhost:8080
VITE_APP_TITLE=MyF ERP System
```

## 开发工作流

### Git工作流
```bash
# 创建特性分支
git checkout -b feature/new-feature-name

# 提交更改
git add .
git commit -m "feat: add new feature description"

# 推送分支
git push origin feature/new-feature-name

# 创建Pull Request (在GitHub/GitLab等平台)
```

### 提交信息规范
使用Conventional Commits规范：

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**类型 (type)**:
- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建或工具更改

**示例**:
```bash
git commit -m "feat(api): add authentication middleware"
git commit -m "fix(ui): resolve button styling issue"
git commit -m "docs: update API documentation"
```

## 开发脚本

### 后端脚本 (backend/package.json)
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "init-db": "node utils/dbUpgrade.js",
    "test": "jest",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix"
  }
}
```

### 前端脚本 (frontend/package.json)
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext js,jsx",
    "lint:fix": "eslint . --ext js,jsx --fix"
  }
}
```

### 根目录脚本 (package.json)
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "cd frontend && npm run build",
    "start": "cd backend && npm start",
    "install:all": "npm install && cd backend && npm install && cd ../frontend && npm install"
  }
}
```

## 代码规范

### ESLint配置
```javascript
// frontend/eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    settings: { react: { version: '18.3' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/jsx-no-target-blank': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]
```

### Prettier配置
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### 代码风格指南

#### JavaScript/JSX
```javascript
// 优先使用const，必要时使用let
const apiUrl = '/api/products';
let currentPage = 1;

// 使用箭头函数
const fetchProducts = async () => {
  try {
    const response = await fetch(apiUrl);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw error;
  }
};

// React组件命名使用PascalCase
const ProductList = ({ products, onSelect }) => {
  return (
    <div className="product-list">
      {products.map(product => (
        <ProductItem 
          key={product.id}
          product={product}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
};
```

#### 文件命名规范
- **组件文件**: PascalCase (ProductList.jsx)
- **钩子文件**: camelCase (useProductData.js)
- **工具文件**: camelCase (apiClient.js)
- **常量文件**: camelCase (constants.js)
- **样式文件**: kebab-case (product-list.css)

## 调试工具

### 浏览器开发者工具
- **Elements**: 检查DOM结构和CSS
- **Console**: 查看日志和错误信息
- **Network**: 监控API请求和响应
- **Application**: 检查LocalStorage和缓存
- **React Developer Tools**: React组件调试

### 后端调试
```javascript
// 使用VS Code调试配置
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/server.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeExecutable": "nodemon"
    }
  ]
}
```

### 数据库调试
```bash
# SQLite命令行工具
sqlite3 data/data.db

# 常用查询
.tables                           # 显示所有表
.schema products                  # 显示表结构
SELECT * FROM products LIMIT 5;  # 查询数据
.exit                            # 退出
```

### 日志调试
```javascript
// 使用logger进行调试
const logger = require('./utils/logger');

// 在关键位置添加日志
logger.debug('Function called with params:', { param1, param2 });
logger.info('Operation completed successfully');
logger.warn('Potential issue detected');
logger.error('Operation failed:', error);
```

## 测试策略

### 单元测试
```javascript
// 使用Jest进行单元测试
// tests/utils/decimalCalculator.test.js
const decimalCalc = require('../../backend/utils/decimalCalculator');

describe('DecimalCalculator', () => {
  test('should add two decimals correctly', () => {
    const result = decimalCalc.add(0.1, 0.2);
    expect(result).toBe(0.3);
  });
  
  test('should handle large numbers', () => {
    const result = decimalCalc.multiply(999999.99, 1000);
    expect(result).toBe(999999990);
  });
});
```

### API测试
```javascript
// 使用supertest进行API测试
const request = require('supertest');
const app = require('../server');

describe('Products API', () => {
  test('GET /api/products should return products list', async () => {
    const response = await request(app)
      .get('/api/products')
      .expect(200);
    
    expect(Array.isArray(response.body)).toBe(true);
  });
  
  test('POST /api/products should create new product', async () => {
    const newProduct = {
      product_model: 'Test Product',
      selling_price: 100.00
    };
    
    const response = await request(app)
      .post('/api/products')
      .send(newProduct)
      .expect(201);
    
    expect(response.body.product_model).toBe(newProduct.product_model);
  });
});
```

## 性能监控

### 前端性能
```javascript
// 使用React Profiler
import { Profiler } from 'react';

const onRenderCallback = (id, phase, actualDuration) => {
  console.log('Component render time:', { id, phase, actualDuration });
};

<Profiler id="ProductList" onRender={onRenderCallback}>
  <ProductList products={products} />
</Profiler>
```

### 后端性能
```javascript
// API响应时间监控
const measureResponseTime = (req, res, next) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1000000;
    
    if (duration > 1000) { // 超过1秒的慢查询
      logger.warn('Slow API response', {
        url: req.url,
        method: req.method,
        duration: `${duration.toFixed(2)}ms`
      });
    }
  });
  
  next();
};
```

## 部署准备

### 生产环境构建
```bash
# 前端构建
cd frontend
npm run build

# 后端环境变量
# backend/.env.production
NODE_ENV=production
PORT=3000
JWT_SECRET=your-production-jwt-secret
DB_PATH=../data/data.db
LOG_LEVEL=info
```

### 依赖检查
```bash
# 检查过时的依赖
npm outdated

# 安全审计
npm audit
npm audit fix

# 检查未使用的依赖
npx depcheck
```

### 代码质量检查
```bash
# 运行所有检查
npm run lint          # 代码规范检查
npm run test          # 运行测试
npm run build         # 构建检查

# 代码覆盖率
npm run test -- --coverage
```

## 常见问题解决

### 依赖安装问题
```bash
# 清理缓存重新安装
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 数据库问题
```bash
# 重新初始化数据库
rm data/data.db
cd backend
npm run init-db
```

### 端口冲突
```bash
# 查找占用端口的进程
netstat -ano | findstr :3000  # Windows
lsof -i :3000                 # macOS/Linux

# 杀死进程
taskkill /PID <PID> /F        # Windows
kill -9 <PID>                # macOS/Linux
```

### 内存不足
```bash
# 增加Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=4096"
npm run dev
```

## 开发最佳实践

### 代码组织
- 保持组件小而专一
- 使用自定义钩子抽取逻辑
- 合理使用文件夹结构分组
- 避免深层嵌套的组件结构

### 性能优化
- 使用React.memo避免不必要的重渲染
- 合理使用useMemo和useCallback
- 避免在render函数中创建对象和函数
- 使用懒加载减少初始包大小

### 安全考虑
- 始终验证用户输入
- 使用环境变量存储敏感信息
- 定期更新依赖包
- 实施适当的错误处理

---

*本文档最后更新: 2025年8月*
