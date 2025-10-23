import fs from 'fs';
import path from 'path';
// Note: avoid using __dirname here; resolve paths from process.cwd() to be robust in dev/prod

/**
 * 生成缓存键
 */
export function generateCacheKey(
  startDate: string,
  endDate: string,
  customerCode?: string,
  productModel?: string
): string {
  const customer = customerCode || 'All';
  const product = productModel || 'All';
  return `${startDate}_${endDate}_${customer}_${product}`;
}

/**
 * 生成详细分析缓存键
 */
export function generateDetailCacheKey(
  startDate: string,
  endDate: string,
  customerCode?: string,
  productModel?: string
): string {
  const customer = customerCode || 'All';
  const product = productModel || 'All';
  return `detail_${startDate}_${endDate}_${customer}_${product}`;
}

/**
 * 获取分析数据缓存文件路径
 */
export function getCacheFilePath(): string {
  // Resolve to the repository-level data folder regardless of build output location
  // Prefer current working directory so "node dist/..." and PM2 both work
  const projectRoot = process.cwd();
  return path.resolve(projectRoot, 'data/analysis-cache.json');
}

/**
 * 清理过期缓存数据（30天以上）
 */
export function cleanExpiredCache<T extends Record<string, any>>(cacheData: T): T {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const cleanedData: Record<string, any> = {};
  let cleanedCount = 0;

  Object.entries(cacheData).forEach(([key, data]) => {
    const d: any = data as any;
    if (d && d.last_updated) {
      const lastUpdated = new Date(d.last_updated);
      if (lastUpdated >= thirtyDaysAgo) {
        cleanedData[key] = data;
      } else {
        cleanedCount++;
      }
    } else {
      cleanedData[key] = data;
    }
  });

  if (cleanedCount > 0) {
    console.log(`清理了 ${cleanedCount} 个过期的分析缓存`);
  }

  return cleanedData as T;
}

/**
 * 读取缓存数据
 */
export function readCache(): Record<string, any> {
  const cacheFile = getCacheFilePath();
  if (fs.existsSync(cacheFile)) {
    try {
      const json = fs.readFileSync(cacheFile, 'utf-8');
      const cacheData = JSON.parse(json);
      return cleanExpiredCache(cacheData);
    } catch (e) {
      console.error('读取分析缓存失败:', e);
      return {};
    }
  }
  return {};
}

/**
 * 写入缓存数据
 */
export function writeCache(cacheData: Record<string, any>): boolean {
  const cacheFile = getCacheFilePath();
  try {
    // Ensure parent directory exists to avoid ENOENT
    const dir = path.dirname(cacheFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const cleanedData = cleanExpiredCache(cacheData);
    fs.writeFileSync(cacheFile, JSON.stringify(cleanedData, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('写入分析缓存失败:', e);
    return false;
  }
}
