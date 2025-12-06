import fs from 'fs/promises';
import path from 'path';
import { resolveFilesInDataPath, ensureDirSync } from '@/utils/paths.js';
import { logger } from '@/utils/logger.js';

export async function backupDatabase(): Promise<string> {
  try {
    const sourceDbPath = resolveFilesInDataPath('data.db');
    try {
      await fs.access(sourceDbPath);
    } catch (error) {
      throw new Error('Database file not found: data.db');
    }

    const backupDir = resolveFilesInDataPath('db-backup');
    ensureDirSync(backupDir);

    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    
    const backupFileName = `${year}-${month}-${day}_${hour}-${minute}-${second}.db`;
    const backupFilePath = path.join(backupDir, backupFileName);

    await fs.copyFile(sourceDbPath, backupFilePath);

    logger.info('Database backup successful', {
      source: sourceDbPath,
      backup: backupFilePath,
      timestamp: date.toISOString(),
    });

    return backupFilePath;
  } catch (error) {
    const err = error as Error;
    logger.error('Database backup failed', {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
}
