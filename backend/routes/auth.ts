/**
 * 认证路由
 * 处理用户登录、登出和身份验证
 */
import express, { type Router, type Request, type Response } from 'express';
import { 
  findUser, 
  verifyPassword, 
  signToken, 
  getPublicUser, 
  authenticateToken,
  loginRateLimiter 
} from '@/utils/auth.js';
import { logger } from '@/utils/logger.js';

const router: Router = express.Router();

/**
 * POST /api/auth/login
 * 用户登录
 */
router.post('/login', loginRateLimiter, async (req: Request, res: Response): Promise<Response> => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名或密码错误' });
  }
  
  try {
    const user = findUser(username);
    if (!user || user.enabled === false || !user.password_hash) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }
    
    const { token, expires_in } = signToken(user);

    logger.info('User login success', { username: user.username, role: user.role });
    return res.json({ success: true, token, expires_in, user: getPublicUser(user) });
  } catch (e) {
    const error = e as Error;
    logger.error('Login error', { error: error.message });
    return res.status(500).json({ success: false, message: '服务器内部错误' });
  }
});

/**
 * GET /api/auth/me
 * 获取当前用户信息
 */
router.get('/me', authenticateToken, (req: Request, res: Response): Response => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  
  return res.json({ 
    success: true, 
    user: { 
      username: req.user.username, 
      role: req.user.role, 
      display_name: req.user.name 
    } 
  });
});

/**
 * POST /api/auth/logout
 * 用户登出（无状态JWT，客户端删除token即可）
 */
router.post('/logout', (_req: Request, res: Response): Response => {
  return res.json({ success: true });
});

export default router;
