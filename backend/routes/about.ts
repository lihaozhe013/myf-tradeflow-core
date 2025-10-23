/**
 * 关于信息路由
 * 提供系统关于信息的查询接口
 */
import express, { type Router, type Request, type Response } from 'express';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';
import { logger } from '@/utils/logger.js';
import { resolveFilesInDataPath } from '@/utils/paths';

const router: Router = express.Router();

/**
 * GET /api/about
 * 获取关于信息
 */
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const aboutPath = resolveFilesInDataPath("about.json");
    await fs.access(aboutPath);

    // 读取文件内容
    const data = await fs.readFile(aboutPath, 'utf8');
    const aboutData = JSON.parse(data);

    logger.info('获取关于信息成功');
    res.json(aboutData);
  } catch (error) {
    const err = error as Error;
    logger.error('获取关于信息失败:', err);
    res.status(500).json({
      error: '获取关于信息失败',
      details: err.message,
    });
  }
});

export default router;
