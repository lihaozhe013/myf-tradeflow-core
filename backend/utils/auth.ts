/**
 * 认证和授权模块
 */
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import argon2 from 'argon2';
import { Request, Response, NextFunction } from 'express';
import { logger } from '@/utils/logger';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir: string = path.resolve(__dirname, "../../data");
const usersPath: string = path.join(dataDir, "users.json");
const secretPath: string = path.join(dataDir, "jwt-secret.txt");
const appConfigPath: string = path.join(dataDir, "appConfig.json");

interface UserData {
  username: string;
  password_hash?: string;
  role: string;
  display_name?: string;
  displayName?: string;
  enabled?: boolean;
  last_password_change?: string;
  lastPasswordChange?: string;
}

interface AuthConfig {
  enabled: boolean;
  tokenExpiresInHours: number;
  loginRateLimit: {
    windowMinutes: number;
    maxAttempts: number;
  };
  allowExportsForReader: boolean;
}

interface JWTPayload {
  sub: string;
  role: string;
  name: string;
  pwd_ver: string;
}

interface LoginAttempt {
  count: number;
  firstAt: number;
}

function readJSONSafe<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return fs.readJSONSync(filePath) as T;
  } catch (e) {
    logger.warn("Failed to read JSON file", { filePath, error: (e as Error).message });
    return fallback;
  }
}

export function getAuthConfig(): AuthConfig {
  const cfg = readJSONSafe<any>(appConfigPath, {});
  const auth = cfg?.auth || {};
  return {
    enabled: auth.enabled !== undefined ? auth.enabled : false,
    tokenExpiresInHours: auth.tokenExpiresInHours || 12,
    loginRateLimit: {
      windowMinutes: auth.loginRateLimit?.windowMinutes || 5,
      maxAttempts: auth.loginRateLimit?.maxAttempts || 20,
    },
    allowExportsForReader:
      auth.allowExportsForReader !== undefined
        ? auth.allowExportsForReader
        : true,
  };
}

export function ensureJwtSecret(): string {
  try {
    if (!fs.existsSync(secretPath)) {
      fs.ensureDirSync(path.dirname(secretPath));
      const secret = crypto.randomBytes(64).toString("hex");
      fs.writeFileSync(secretPath, secret, { encoding: "utf8" });
      logger.info("JWT secret created at data/jwt-secret.txt");
      return secret;
    }
    return fs.readFileSync(secretPath, "utf8").trim();
  } catch (e) {
    logger.error("Failed to ensure JWT secret", { error: (e as Error).message });
    // fallback to in-memory secret (not persisted)
    return crypto.randomBytes(64).toString("hex");
  }
}

export function loadUsers(): UserData[] {
  const data = readJSONSafe<{ users?: UserData[] }>(usersPath, { users: [] });
  return Array.isArray(data?.users) ? data.users : [];
}

export function findUser(username: string): UserData | undefined {
  const users = loadUsers();
  return users.find((u) => u.username === username);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch (e) {
    return false;
  }
}

export function getPublicUser(u: UserData | null | undefined): { username: string; role: string; display_name: string } | null {
  if (!u) return null;
  return {
    username: u.username,
    role: u.role,
    display_name: u.display_name || u.displayName || u.username,
  };
}

export function signToken(user: UserData, expiresInHours?: number): { token: string; expires_in: number } {
  const secret = ensureJwtSecret();
  const expSeconds =
    Math.max(1, expiresInHours || getAuthConfig().tokenExpiresInHours) * 3600;
  const payload: JWTPayload = {
    sub: user.username,
    role: user.role,
    name: user.display_name || user.displayName || user.username,
    pwd_ver:
      user.last_password_change ||
      user.lastPasswordChange ||
      new Date(0).toISOString(),
  };
  const token = jwt.sign(payload, secret, {
    algorithm: "HS256",
    expiresIn: expSeconds,
  });
  return { token, expires_in: expSeconds };
}

// In-memory login attempts: key => { count, firstAt }
const attempts = new Map<string, LoginAttempt>();

export function loginRateLimiter(req: Request, res: Response, next: NextFunction): void {
  const { windowMinutes, maxAttempts } = getAuthConfig().loginRateLimit;
  const windowMs = windowMinutes * 60 * 1000;
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const username = (req.body && req.body.username) || "unknown";
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
    res.status(429).json({
      success: false,
      message: "Too many login attempts. Please try later.",
    });
    return;
  }
  next();
}

export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const { enabled } = getAuthConfig();
  if (!enabled) {
    // Auth disabled: inject a dev user
    req.user = {
      username: "dev",
      role: "editor",
      name: "Developer",
      pwd_ver: new Date().toISOString(),
    };
    next();
    return;
  }

  // Allow unauthenticated access to login route
  if (req.originalUrl && req.originalUrl.startsWith("/api/auth/login")) {
    next();
    return;
  }

  const auth = req.headers['authorization'] || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }
  try {
    const secret = ensureJwtSecret();
    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as JWTPayload;
    const user = findUser(decoded.sub);
    if (!user || user.enabled === false) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    const tokenPwdVer = new Date(decoded.pwd_ver || 0).getTime();
    const userPwdVer = new Date(user.last_password_change || 0).getTime();
    if (tokenPwdVer < userPwdVer) {
      res.status(401).json({ success: false, message: "Token expired" });
      return;
    }
    req.user = {
      username: user.username,
      role: user.role,
      name: user.display_name || user.username,
      pwd_ver: decoded.pwd_ver,
    };
    next();
  } catch (e) {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
}

export function authorize(roles: string | string[] = ["editor", "reader"]) {
  const set = new Set(Array.isArray(roles) ? roles : [roles]);
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }
    if (!set.has(req.user.role)) {
      res.status(403).json({ success: false, message: "Forbidden" });
      return;
    }
    next();
  };
}

// 检查只读用户的写操作权限
export function checkWritePermission(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return;
  }

  const method = req.method.toUpperCase();
  const { allowExportsForReader } = getAuthConfig();

  // 如果是编辑者角色，允许所有操作
  if (req.user.role === "editor") {
    next();
    return;
  }

  // 如果是只读用户
  if (req.user.role === "reader") {
    // 允许GET请求
    if (method === "GET") {
      next();
      return;
    }

    // 如果配置允许，reader可以使用导出功能的POST请求
    if (
      allowExportsForReader &&
      method === "POST" &&
      (req.originalUrl.includes("/api/export") ||
        req.originalUrl.includes("/api/overview") ||
        req.originalUrl.includes("/api/analysis"))
    ) {
      next();
      return;
    }

    // 拒绝其他写操作
    if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
      logger.warn("只读用户尝试执行写操作", {
        username: req.user.username,
        method: method,
        url: req.originalUrl,
        ip: req.ip,
      });
      res.status(403).json({
        success: false,
        message: "只读用户无权执行此操作",
        error_code: "READ_ONLY_ACCESS_DENIED",
      });
      return;
    }
  }

  // 对于其他未知角色，拒绝访问
  res.status(403).json({
    success: false,
    message: "权限不足",
    error_code: "INSUFFICIENT_PERMISSIONS",
  });
}
