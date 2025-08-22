const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const { logger } = require('./logger');

const dataDir = path.resolve(__dirname, '../../data');
const usersPath = path.join(dataDir, 'users.json');
const secretPath = path.join(dataDir, 'jwt-secret.txt');
const appConfigPath = path.join(dataDir, 'appConfig.json');

function readJSONSafe(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return fs.readJSONSync(filePath);
  } catch (e) {
    logger.warn('Failed to read JSON file', { filePath, error: e.message });
    return fallback;
  }
}

function getAuthConfig() {
  const cfg = readJSONSafe(appConfigPath, {});
  const auth = cfg && cfg.auth ? cfg.auth : {};
  return {
    enabled: auth.enabled !== undefined ? auth.enabled : false,
    tokenExpiresInHours: auth.tokenExpiresInHours || 12,
    loginRateLimit: {
      windowMinutes: auth.loginRateLimit?.windowMinutes || 5,
      maxAttempts: auth.loginRateLimit?.maxAttempts || 20,
    },
    allowExportsForReader: auth.allowExportsForReader !== undefined ? auth.allowExportsForReader : true,
  };
}

function ensureJwtSecret() {
  try {
    if (!fs.existsSync(secretPath)) {
      fs.ensureDirSync(path.dirname(secretPath));
      const secret = crypto.randomBytes(64).toString('hex');
      fs.writeFileSync(secretPath, secret, { encoding: 'utf8' });
      logger.info('JWT secret created at data/jwt-secret.txt');
      return secret;
    }
    return fs.readFileSync(secretPath, 'utf8').trim();
  } catch (e) {
    logger.error('Failed to ensure JWT secret', { error: e.message });
    // fallback to in-memory secret (not persisted)
    return crypto.randomBytes(64).toString('hex');
  }
}

function loadUsers() {
  const data = readJSONSafe(usersPath, { users: [] });
  return Array.isArray(data?.users) ? data.users : [];
}

function findUser(username) {
  const users = loadUsers();
  return users.find(u => u.username === username);
}

async function verifyPassword(plain, hash) {
  try {
    return await argon2.verify(hash, plain);
  } catch (e) {
    return false;
  }
}

function getPublicUser(u) {
  if (!u) return null;
  return {
    username: u.username,
    role: u.role,
    display_name: u.display_name || u.displayName || u.username,
  };
}

function signToken(user, expiresInHours) {
  const secret = ensureJwtSecret();
  const expSeconds = Math.max(1, (expiresInHours || getAuthConfig().tokenExpiresInHours)) * 3600;
  const payload = {
    sub: user.username,
    role: user.role,
    name: user.display_name || user.displayName || user.username,
    pwd_ver: user.last_password_change || user.lastPasswordChange || new Date(0).toISOString(),
  };
  const token = jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: expSeconds });
  return { token, expires_in: expSeconds };
}

// In-memory login attempts: key => { count, firstAt }
const attempts = new Map();

function loginRateLimiter(req, res, next) {
  const { windowMinutes, maxAttempts } = getAuthConfig().loginRateLimit;
  const windowMs = windowMinutes * 60 * 1000;
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const username = (req.body && req.body.username) || 'unknown';
  const key = `${ip}:${username}`;
  const now = Date.now();

  const rec = attempts.get(key) || { count: 0, firstAt: now };
  if (now - rec.firstAt > windowMs) {
    // reset window
    rec.count = 0;
    rec.firstAt = now;
  }
  rec.count += 1;
  attempts.set(key, rec);

  if (rec.count > maxAttempts) {
    return res.status(429).json({ success: false, message: 'Too many login attempts. Please try later.' });
  }
  next();
}

function authenticateToken(req, res, next) {
  const { enabled } = getAuthConfig();
  if (!enabled) {
    // Auth disabled: inject a dev user
    req.user = { username: 'dev', role: 'editor', name: 'Developer', pwd_ver: new Date().toISOString() };
    return next();
  }

  // Allow unauthenticated access to login route
  if (req.originalUrl && req.originalUrl.startsWith('/api/auth/login')) {
    return next();
  }

  const auth = req.headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  try {
    const secret = ensureJwtSecret();
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });
    const user = findUser(decoded.sub);
    if (!user || user.enabled === false) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const tokenPwdVer = new Date(decoded.pwd_ver || 0).getTime();
    const userPwdVer = new Date(user.last_password_change || 0).getTime();
    if (tokenPwdVer < userPwdVer) {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    req.user = { username: user.username, role: user.role, name: user.display_name || user.username, pwd_ver: decoded.pwd_ver };
    return next();
  } catch (e) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
}

function authorize(roles = ['editor', 'reader']) {
  const set = new Set(Array.isArray(roles) ? roles : [roles]);
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!set.has(req.user.role)) return res.status(403).json({ success: false, message: 'Forbidden' });
    next();
  };
}

// 检查只读用户的写操作权限
function checkWritePermission(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const method = req.method.toUpperCase();
  const { allowExportsForReader } = getAuthConfig();
  
  // 如果是编辑者角色，允许所有操作
  if (req.user.role === 'editor') {
    return next();
  }
  
  // 如果是只读用户
  if (req.user.role === 'reader') {
    // 允许GET请求
    if (method === 'GET') {
      return next();
    }
    
    // 如果配置允许，reader可以使用导出功能的POST请求
    if (allowExportsForReader && method === 'POST' && req.originalUrl.includes('/api/export')) {
      return next();
    }
    
    // 拒绝其他写操作
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      logger.warn('只读用户尝试执行写操作', {
        username: req.user.username,
        method: method,
        url: req.originalUrl,
        ip: req.ip
      });
      return res.status(403).json({ 
        success: false, 
        message: '只读用户无权执行此操作',
        error_code: 'READ_ONLY_ACCESS_DENIED'
      });
    }
  }
  
  // 对于其他未知角色，拒绝访问
  return res.status(403).json({ 
    success: false, 
    message: '权限不足',
    error_code: 'INSUFFICIENT_PERMISSIONS'
  });
}

module.exports = {
  getAuthConfig,
  ensureJwtSecret,
  loadUsers,
  findUser,
  verifyPassword,
  signToken,
  getPublicUser,
  loginRateLimiter,
  authenticateToken,
  authorize,
  checkWritePermission,
};
