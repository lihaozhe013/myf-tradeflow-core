// 认证工具函数
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Token 管理
export const tokenManager = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },
  
  setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },
  
  clearToken() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
};

// 用户信息管理
export const userManager = {
  getUser() {
    const userData = localStorage.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null;
  },
  
  setUser(user) {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }
};

// 检查是否已认证
export const isAuthenticated = () => {
  const token = tokenManager.getToken();
  const user = userManager.getUser();
  return !!(token && user);
};

// 检查用户角色
export const hasRole = (requiredRole) => {
  const user = userManager.getUser();
  if (!user) return false;
  
  if (requiredRole === 'reader') {
    return user.role === 'reader' || user.role === 'editor';
  }
  if (requiredRole === 'editor') {
    return user.role === 'editor';
  }
  return false;
};

// API 调用
export const authAPI = {
  async login(username, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '登录失败');
    }
    
    return response.json();
  },
  
  async getCurrentUser() {
    const token = tokenManager.getToken();
    if (!token) {
      throw new Error('No token found');
    }
    
    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to get user info');
    }
    
    return response.json();
  },
  
  logout() {
    // 无状态JWT，只需清除本地存储
    tokenManager.clearToken();
    userManager.setUser(null);
  }
};
