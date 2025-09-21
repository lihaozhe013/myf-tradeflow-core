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
VITE_APP_TITLE="MYF TRADEFLOW CORE"
```

*本文档最后更新: 2025年8月*
