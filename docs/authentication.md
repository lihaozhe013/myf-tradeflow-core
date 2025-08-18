# 认证架构

## 认证方式

**JWT无状态认证** - 基于JSON Web Token的无状态认证机制

### 特性
- 无需服务器端存储会话状态
- 支持分布式部署
- Token包含用户信息和权限
- 自动过期管理

## 角色权限体系

### 角色定义
| 角色 | 权限范围 | 说明 |
|------|----------|------|
| `admin` | 全部权限 | 系统管理员，可执行所有操作 |
| `editor` | 读写权限 | 业务操作员，可查看和修改数据 |
| `viewer` | 只读权限 | 只能查看数据，不能修改 |

### 权限控制
- **API级别**: 每个接口根据用户角色验证权限
- **功能级别**: 前端根据角色显示/隐藏操作按钮
- **数据级别**: 敏感操作记录操作用户信息

## 技术实现

### 后端认证

#### JWT配置
```javascript
// JWT密钥配置
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
const JWT_EXPIRES_IN = '24h'; // Token有效期

// Token生成
const token = jwt.sign(
  { username, role },
  JWT_SECRET,
  { expiresIn: JWT_EXPIRES_IN }
);
```

#### 认证中间件
```javascript
// 位置: backend/middleware/auth.js
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: '令牌无效' });
    req.user = user;
    next();
  });
};
```

#### 权限验证中间件
```javascript
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
};
```

### 前端认证

#### 认证上下文
```javascript
// 位置: frontend/src/auth/AuthContext.jsx
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 认证状态管理
  const login = async (credentials) => { ... };
  const logout = () => { ... };
  const checkAuth = async () => { ... };
  
  return (
    <AuthContext.Provider value={{ user, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### Token管理器
```javascript
// 位置: frontend/src/auth/auth.js
export const tokenManager = {
  getToken: () => localStorage.getItem('token'),
  setToken: (token) => localStorage.setItem('token', token),
  clearToken: () => localStorage.removeItem('token'),
  isTokenValid: () => {
    const token = tokenManager.getToken();
    // 检查token有效性
  }
};
```

#### 请求拦截器
```javascript
// 位置: frontend/src/utils/request.js
const createRequest = (baseURL = '') => {
  const request = async (url, options = {}) => {
    const token = tokenManager.getToken();
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };
    
    // 自动添加认证头
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const response = await fetch(`${baseURL}${url}`, config);
    
    // 处理401错误
    if (response.status === 401) {
      tokenManager.clearToken();
      window.location.href = '/login';
      throw new Error('认证失败，请重新登录');
    }
    
    return response;
  };
  
  return request;
};
```

## 安全机制

### 密码安全
- **加密算法**: Argon2 (抗彩虹表攻击)
- **盐值**: 自动生成随机盐值
- **加密强度**: 高强度配置

```javascript
const argon2 = require('argon2');

// 密码加密
const hashPassword = async (password) => {
  return await argon2.hash(password);
};

// 密码验证
const verifyPassword = async (password, hash) => {
  return await argon2.verify(hash, password);
};
```

### Token安全
- **签名验证**: HMAC-SHA256签名
- **过期控制**: 24小时自动过期
- **传输安全**: HTTPS传输(生产环境)

### 前端安全
- **自动登出**: Token过期自动跳转登录
- **路由守卫**: 未认证用户自动重定向
- **敏感信息**: 不在localStorage存储敏感信息

## API认证集成

### 后端路由保护
```javascript
// 需要认证的路由
router.use('/api/inbound', authenticateToken, inboundRoutes);
router.use('/api/outbound', authenticateToken, outboundRoutes);

// 需要特定权限的路由
router.delete('/api/inbound/:id', 
  authenticateToken, 
  requireRole(['admin', 'editor']), 
  deleteInboundRecord
);
```

### 前端API调用
```javascript
// 使用认证钩子
import { useApi } from '../hooks/useApi';

const MyComponent = () => {
  const { get, post, loading, error } = useApi();
  
  const fetchData = async () => {
    try {
      const result = await get('/api/inbound');
      // 自动处理认证
    } catch (err) {
      // 自动处理401错误
    }
  };
};
```

## 用户管理

### 默认用户
- **用户名**: `admin`
- **密码**: `123456`
- **角色**: `admin`

### 用户操作
- **创建用户**: 管理员权限
- **修改密码**: 用户自己或管理员
- **用户禁用**: 管理员权限
- **角色变更**: 管理员权限

## 会话管理

### Token生命周期
1. **登录**: 生成Token并返回给前端
2. **存储**: 前端存储在localStorage
3. **使用**: 每次请求自动携带Token
4. **验证**: 后端验证Token有效性
5. **过期**: 24小时后自动过期
6. **刷新**: 需要重新登录获取新Token

### 自动登出机制
- Token过期自动登出
- API返回401时自动登出
- 浏览器关闭时清除会话(可选)

## 开发指南

### 新增需认证的API
```javascript
// 1. 添加认证中间件
router.use('/api/new-module', authenticateToken, newModuleRoutes);

// 2. 可选: 添加权限验证
router.delete('/api/new-module/:id', 
  authenticateToken,
  requireRole(['admin']),
  deleteHandler
);

// 3. 在处理函数中可访问用户信息
const handler = (req, res) => {
  const { username, role } = req.user;
  // 业务逻辑
};
```

### 前端受保护页面
```javascript
import { useAuth } from '../auth/AuthContext';

const ProtectedPage = () => {
  const { user } = useAuth();
  
  if (!user) {
    return <div>请先登录</div>;
  }
  
  return (
    <div>
      {user.role === 'admin' && <AdminButton />}
      <Content />
    </div>
  );
};
```

## 部署考虑

### 环境变量
```bash
# JWT密钥(生产环境必须设置)
JWT_SECRET=your-very-secure-secret-key

# Token有效期
JWT_EXPIRES_IN=24h

# 是否启用HTTPS
ENABLE_HTTPS=true
```

### 安全配置
- 生产环境必须使用HTTPS
- JWT密钥必须足够复杂且定期更换
- 启用CORS保护
- 配置安全请求头

---

*本文档最后更新: 2025年8月*
