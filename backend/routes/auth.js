const express = require('express');
const router = express.Router();
const { findUser, verifyPassword, signToken, getPublicUser, authenticateToken } = require('../utils/auth');
const { loginRateLimiter } = require('../utils/auth');
const { logger } = require('../utils/logger');

// POST /api/auth/login
router.post('/login', loginRateLimiter, async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名或密码错误' });
  }
  try {
    const user = findUser(username);
    if (!user || user.enabled === false) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    const ok = await verifyPassword(password, user.password_hash || user.passwordHash);
    if (!ok) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    const { token, expires_in } = signToken(user);

    logger.info('User login success', { username: user.username, role: user.role });
    return res.json({ success: true, token, expires_in, user: getPublicUser(user) });
  } catch (e) {
    logger.error('Login error', { error: e.message });
    return res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  return res.json({ success: true, user: { username: req.user.username, role: req.user.role, display_name: req.user.name } });
});

// POST /api/auth/logout (无状态，可选)
router.post('/logout', (req, res) => {
  return res.json({ success: true });
});

module.exports = router;
