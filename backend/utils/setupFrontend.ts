/**
 * 前端静态资源服务配置
 * 为 SPA 应用提供静态文件服务和路由回退
 */
import express, { type Application } from 'express';
import path from 'path';
import { getAppRoot } from '@/utils/paths';

/**
 * 配置前端静态资源服务
 * @param app Express 应用实例
 */
function setupFrontend(app: Application): void {
  // 假设前端已构建到 frontend/dist
  const frontendDist = path.resolve(getAppRoot(), '../frontend');
  app.use(express.static(frontendDist));
  
  // Express 5.x 推荐用 '/*' 作为 SPA 兜底路由
  app.get('/*', (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

export default setupFrontend;
