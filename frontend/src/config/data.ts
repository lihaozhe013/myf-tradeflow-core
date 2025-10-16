/**
 * 应用配置数据
 * 从 JSON 文件导入并类型化
 */

import type { AppConfigData } from '@/config/types';

// 直接从 JSON 导入（Vite 会处理）
import rawConfig from '@/config/appConfig.json';

// 导出类型化的配置数据
export const appConfigData = rawConfig as unknown as AppConfigData;
