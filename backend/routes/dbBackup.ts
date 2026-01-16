import express, { type Router, type Request, type Response } from 'express';
import { backupDatabase } from '@/utils/dbBackup.js';
import { logger } from '@/utils/logger.js';

const router: Router = express.Router();

/**
 * POST /api/db-backup
 */
router.post('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const backupPath = await backupDatabase();
    
    res.json({
      success: true,
      message: 'Database backup successful',
      backupPath: backupPath,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const err = error as Error;
    logger.error('Database backup API failed:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to backup database',
      details: err.message,
    });
  }
});

export default router;
