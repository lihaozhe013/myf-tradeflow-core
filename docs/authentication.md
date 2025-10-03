# 认证架构设计与实现

## 🔐 认证方式

**JWT无状态认证** - 基于JSON Web Token的无状态认证机制

### 特性
- 无需服务器端存储会话状态
- 支持分布式部署
- Token包含用户信息和权限
- 自动过期管理
- 前端自动认证集成

## 👥 角色权限体系

### 角色定义
| 角色 | 权限范围 | 说明 |
|------|----------|------|
| `editor` | 读写权限 | 业务操作员，可查看和修改数据 |
| `reader` | 只读权限 | 只能查看数据和导出，不能修改 |

### 权限控制
- **API级别**: 每个接口根据用户角色验证权限
- **功能级别**: 前端根据角色显示/隐藏操作按钮
- **数据级别**: 敏感操作记录操作用户信息

## 🏗️ 技术实现

### 后端认证

#### 用户存储
```json
// /data/users.json
{
  "users": [
    {
      "username": "admin",
      "password_hash": "$argon2id$v=19$m=65536,t=3,p=1$...",
      "role": "editor",
      "display_name": "系统管理员",
      "enabled": true,
      "last_password_change": "2025-08-20T07:00:00.000Z"
    }
  ]
}
```

#### JWT配置
```javascript
// JWT密钥配置
const JWT_SECRET = process.env.JWT_SECRET || readFromFile('/data/jwt-secret.txt');
const JWT_EXPIRES_IN = '12h'; // Token有效期

// Token生成
const token = jwt.sign(
  { 
    sub: username,
    role: role,
    name: display_name,
    pwd_ver: last_password_change,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (12 * 3600)
  },
  JWT_SECRET
);
```

#### 认证中间件
```javascript
// 位置: backend/utils/auth.js
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: '令牌无效' });
    
    // 检查用户是否仍然存在且启用
    const currentUser = getUserFromFile(user.sub);
    if (!currentUser || !currentUser.enabled) {
      return res.status(401).json({ error: '用户不存在或已禁用' });
    }
    
    // 检查密码是否已更改（软吊销）
    if (user.pwd_ver < currentUser.last_password_change) {
      return res.status(401).json({ error: '令牌已失效，请重新登录' });
    }
    
    req.user = user;
    next();
  });
};
```

#### 权限验证
```javascript
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
};

// 权限矩阵
const permissions = {
  'GET': ['editor', 'reader'],           // 查看数据
  'POST /api/export/*': ['editor', 'reader'], // 导出功能
  'POST': ['editor'],                    // 创建数据
  'PUT': ['editor'],                     // 修改数据
  'DELETE': ['editor']                   // 删除数据
};
```

### 只读用户（reader）后端写权限控制

实现说明：
- 后端在认证中间件（`backend/utils/auth.js` 中的 `authenticateToken`）之后，增加了一个写权限检查中间件 `checkWritePermission`。
- `checkWritePermission` 会根据请求方法和当前 `req.user.role` 决定是否允许访问：
  - 如果角色是 `editor`：允许所有请求（读/写）。
  - 如果角色是 `reader`：仅允许 `GET` 请求和部分导出相关的 `POST`（见下文）；对 `POST`、`PUT`、`PATCH`、`DELETE` 等写操作统一拒绝。

导出例外：
- 为了支持只读用户导出数据（前端不需要修改），新增了配置项 `auth.allowExportsForReader`（见 `data/appConfig.json`）。
- 当该配置为 `true` 时，`reader` 角色仍然可以对 `/api/export` 路径发起 `POST` 请求以触发导出。默认仓库配置为 `true`。

错误返回与日志：
- 当 `reader` 触发被禁止的写操作时，后端会返回 HTTP 403，响应示例：

```json
{
  "success": false,
  "message": "只读用户无权执行此操作",
  "error_code": "READ_ONLY_ACCESS_DENIED"
}
```

- 同时会在后端日志中记录一条警告，包含用户名、请求方法、URL 与客户端 IP，便于审计与排查。

### 前端认证

#### 认证上下文
```javascript
// 位置: frontend/src/auth/AuthContext.jsx
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const login = async (credentials) => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    tokenManager.setToken(response.token);
    setUser(response.user);
  };
  
  const logout = () => {
    tokenManager.clearToken();
    setUser(null);
    window.location.href = '/login';
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### 自动认证请求
```javascript
// 位置: frontend/src/utils/request.js
const createRequest = () => {
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
    
    // 自动添加/api前缀
    const fullUrl = url.startsWith('/api') ? url : `/api${url}`;
    const response = await fetch(fullUrl, config);
    
    // 处理认证错误
    if (response.status === 401) {
      tokenManager.clearToken();
      window.location.href = '/login';
      throw new Error('认证失败，请重新登录');
    }
    
    if (response.status === 403) {
      throw new Error('权限不足');
    }
    
    return await response.json();
  };
  
  return request;
};
```

#### 认证Hooks
```javascript
// 位置: frontend/src/hooks/useSimpleApi.js
export const useSimpleApi = () => {
  const [loading, setLoading] = useState(false);
  
  const request = useCallback(async (url, options = {}) => {
    try {
      setLoading(true);
      return await apiRequest(url, options);
    } catch (err) {
      message.error(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  const get = useCallback((url) => request(url, { method: 'GET' }), [request]);
  const post = useCallback((url, data) => request(url, { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }), [request]);
  
  return { loading, get, post, put, delete: del, postBlob };
};

export const useSimpleApiData = (url, defaultData) => {
  const [data, setData] = useState(defaultData);
  const [loading, setLoading] = useState(false);
  
  const fetchData = useCallback(async () => {
    if (!url) return;
    try {
      setLoading(true);
      const response = await apiRequest(url);
      setData(response || defaultData);
    } catch (err) {
      console.error('数据获取失败:', err);
    } finally {
      setLoading(false);
    }
  }, [url, defaultData]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, refetch: fetchData };
};
```

## 🔒 安全机制

### 密码安全
- **加密算法**: Argon2id (抗彩虹表攻击)
- **盐值**: 自动生成随机盐值
- **加密强度**: 高强度配置

### Token安全
- **签名验证**: HMAC-SHA256签名
- **过期控制**: 12小时自动过期
- **软吊销**: 密码变更后旧Token失效
- **传输安全**: 通过Nginx代理实现HTTPS传输

### 登录安全
- **防暴力破解**: 5分钟内最多20次尝试
- **错误信息**: 统一提示"用户名或密码错误"
- **账号锁定**: enabled字段控制账号启用状态

## 📚 API接口

### 认证接口
```javascript
// POST /api/auth/login
{
  "username": "admin",
  "password": "123456"
}
// 响应
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 43200,
  "user": {
    "username": "admin",
    "role": "editor",
    "display_name": "系统管理员"
  }
}

// GET /api/auth/me - 获取当前用户信息
// POST /api/auth/logout - 登出(可选实现)
```

## 🛠️ 部署配置

### 环境变量
```bash
# JWT密钥(生产环境必须设置)
JWT_SECRET=your-very-secure-secret-key-at-least-64-chars

# 认证开关
AUTH_ENABLED=true

# Token有效期
JWT_EXPIRES_IN=12h
```

### 配置文件
```json
// data/appConfig.json
{
  "auth": {
    "enabled": true,
    "tokenExpiresInHours": 12,
    "loginRateLimit": {
      "windowMinutes": 5,
      "maxAttempts": 20
    },
    "allowExportsForReader": true
  }
}
```

## 👤 用户管理

### 默认用户
```json
{
  "username": "admin",
  "password": "123456",
  "role": "editor"
}
```

### 手动管理用户
```bash
# 1. 生成密码哈希
node backend/gen-hash.js "new-password"

# 2. 编辑 /data/users.json
{
  "users": [
    {
      "username": "new-user",
      "password_hash": "生成的哈希值",
      "role": "reader",
      "display_name": "新用户",
      "enabled": true,
      "last_password_change": "2025-08-20T10:00:00.000Z"
    }
  ]
}

# 3. 重启服务生效
```

## ✅ 实施状态

### 已完成页面
- [x] Overview - 总览
- [x] Stock - 库存管理
- [x] Products - 产品管理
- [x] Partners - 合作伙伴管理
- [x] ProductPrices - 产品价格管理
- [x] Inbound - 入库管理
- [x] Outbound - 出库管理
- [x] Payable - 应付账款管理
- [x] Receivable - 应收账款管理
- [x] Analysis - 数据分析

### 认证特性
- [x] JWT无状态认证
- [x] 角色权限控制
- [x] 自动认证集成
- [x] 错误处理机制
- [x] 安全防护措施

---

**文档版本**: 1.0  
**最后更新**: 2025年8月20日  
**实施状态**: 生产就绪
