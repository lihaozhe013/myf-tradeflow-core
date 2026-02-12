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
 * AuthConfig Interface
 */
export interface AuthConfig {
  enabled: boolean;
  tokenExpiresInHours?: number;
  loginRateLimit?: {
    windowMinutes: number;
    maxAttempts: number;
  };
  allowExportsForReader?: boolean;
}

/**
 * AppConfig Interface
 */
export interface AppConfig {
  currency_unit_symbol?: string;
  pagination_limit?: number;
  database?: {
    type?: 'sqlite' | 'postgresql';
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    dbName?: string;
  };
  auth?: AuthConfig;
  server?: ServerConfig;
  frontend?: FrontendConfig;
}
