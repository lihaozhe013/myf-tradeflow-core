/**
 * 应用配置类型定义
 */

// 付款方式类型
export type PaymentMethod = 'Cash' | 'E-Transfer' | 'Cheque' | "Banker's acceptance" | 'Other';

// 付款方式配置
export interface PaymentMethodConfig {
  readonly label: string;
  readonly code: string;
}

// 付款方式配置对象
export interface PaymentMethodsConfig {
  readonly list: readonly PaymentMethod[];
  readonly default: PaymentMethod;
  readonly config: {
    readonly cash: PaymentMethodConfig;
    readonly bank_transfer: PaymentMethodConfig;
    readonly check: PaymentMethodConfig;
    readonly bank_acceptance: PaymentMethodConfig;
    readonly other: PaymentMethodConfig;
  };
}

// 产品类别类型
export type ProductCategory = string;

// 产品类别配置
export interface ProductCategoriesConfig {
  readonly list: readonly ProductCategory[];
  readonly default: ProductCategory;
}

// 认证配置
export interface AuthConfig {
  readonly enabled: boolean;
  readonly tokenExpiresInHours: number;
  readonly loginRateLimit: {
    readonly windowMinutes: number;
    readonly maxAttempts: number;
  };
  readonly allowExportsForReader: boolean;
}

// 服务器配置
export interface ServerConfig {
  readonly httpPort: number;
}

// 前端配置
export interface FrontendConfig {
  readonly hostByBackend: boolean;
  readonly distPath: string;
  readonly fallbackToIndex: boolean;
}

// 应用配置主接口
export interface AppConfigData {
  readonly paymentMethods: PaymentMethodsConfig;
  readonly productCategories: ProductCategoriesConfig;
  readonly auth: AuthConfig;
  readonly server: ServerConfig;
  readonly frontend: FrontendConfig;
}

// 选项类型（用于下拉框等）
export interface SelectOption<T = string> {
  readonly value: T;
  readonly label: string;
}
