/**
 * 后端类型定义入口文件
 */

// 导出配置相关类型
export type {
  ServerConfig,
  HttpsConfig,
  FrontendConfig,
  AppConfig
} from './config';

// 导出 Express 扩展类型
export type {
  User,
  CustomError
} from './express.d';

// 重新导出 express.d.ts 中的全局类型扩展
import './express.d';
