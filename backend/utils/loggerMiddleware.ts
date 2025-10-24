import { Request, Response, NextFunction } from "express";
import { logger, accessLogger } from "@/utils/logger";

const STATIC_EXTENSIONS = [
  ".js",
  ".css",
  ".map",
  ".ico",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
];

// Irrelevant path filtering (scanners, crawlers, etc.)
const IGNORE_PATHS = [
  "/plugin.php",
  "/mag/",
  "/robots.txt",
  "/favicon.ico",
  "/.well-known",
  "/sitemap",
  "/xmlrpc.php",
  "/wp-",
  "/admin",
  "/phpmyadmin",
  "/mysql",
  "/sql",
  "/test",
  "/backup",
  "/tmp",
  "057707.com",
  ".php",
  ".asp",
  ".jsp",
];

/**
 * Determine whether this request should be logged
 */
const shouldLogRequest = (url: string, _method: string): boolean => {
  // Static File Filtering
  const hasStaticExtension = STATIC_EXTENSIONS.some((ext) =>
    url.toLowerCase().includes(ext)
  );
  if (hasStaticExtension) return false;

  // Irrelevant Path Filtering
  const isIgnoredPath = IGNORE_PATHS.some((path) =>
    url.toLowerCase().includes(path.toLowerCase())
  );
  if (isIgnoredPath) return false;

  // Log all API requests (including GET and POST)
  if (url.startsWith("/api/")) return true;

  // Log important page requests (based on frontend routing)
  if (url === "/" || url.startsWith("/login")) return true;

  return false;
};

/**
 * Access Logger Middleware
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();

  // Request logging begins
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get("User-Agent"),
    timestamp: new Date().toISOString(),
  };

  const shouldLog = shouldLogRequest(req.originalUrl, req.method);

  // Listen for the end of response event
  res.on("finish", () => {
    if (!shouldLog) return;

    const duration = Date.now() - start;
    const responseInfo = {
      ...requestInfo,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get("Content-Length") || 0,
    };

    if (req.user) {
      Object.assign(responseInfo, {
        user: { username: req.user.username, role: req.user.role },
      });
    }

    // Record access logs (with user information)
    const userPart = req.user
      ? ` user=${req.user.username} role=${req.user.role}`
      : " user=anonymous";
    accessLogger.info(
      `${req.method} ${req.originalUrl} ${res.statusCode}${userPart}`
    );

    // Determine the log level based on the status code.
    if (res.statusCode >= 400) {
      logger.warn("HTTP Request", responseInfo);
    } else {
      // Record all successful API requests, including POST operations.
      logger.info("API Request", {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        user: req.user ? req.user.username : "anonymous",
      });
    }
  });

  next();
};

/**
 * Error Log Middleware
 */
export const errorLogger = (
  err: Error,
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const errorInfo: Record<string, any> = {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.socket.remoteAddress,
    timestamp: new Date().toISOString(),
    body: req.body,
    params: req.params,
    query: req.query,
  };

  if (req.user) {
    errorInfo["user"] = { username: req.user.username, role: req.user.role };
  }

  logger.error("API Error", errorInfo);
  next(err);
};
