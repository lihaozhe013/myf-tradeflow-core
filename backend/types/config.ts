/**
 * HTTP Port Interface
 */
export interface ServerConfig {
  httpPort?: number;
}

/**
 * FrontendConfig Interface
 */
export interface FrontendConfig {
  hostByBackend?: boolean;
  distPath?: string;
  fallbackToIndex?: boolean;
}

/**
 * AppConfig Interface
 */
export interface AppConfig {
  server?: ServerConfig;
  frontend?: FrontendConfig;
}
