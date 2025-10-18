/**
 * 服务器配置接口
 */
export interface ServerConfig {
  httpPort?: number;
}

/**
 * HTTPS 配置接口
 */
export interface HttpsConfig {
  enabled?: boolean;
  port?: number;
  domain?: string;
  certPath?: string;
  keyPath?: string;
  forceHttps?: boolean;
  redirectHttp?: boolean;
}

/**
 * 前端配置接口
 */
export interface FrontendConfig {
  hostByBackend?: boolean;
  distPath?: string;
  fallbackToIndex?: boolean;
}

/**
 * 应用配置接口
 */
export interface AppConfig {
  server?: ServerConfig;
  https?: HttpsConfig;
  frontend?: FrontendConfig;
}
