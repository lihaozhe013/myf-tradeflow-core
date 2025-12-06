import fs from 'fs/promises';
import path from 'path';
import { resolveFilesInDataPath, ensureDirSync } from '@/utils/paths.js';
import { logger } from '@/utils/logger.js';

export async function backupDatabase(): Promise<string> {
  try {
    const sourceDbPath = resolveFilesInDataPath('data.db');
    const sourceDbWalPath = resolveFilesInDataPath('data.db-wal');
    try {
      await fs.access(sourceDbPath);
      await fs.access(sourceDbWalPath);
    } catch (error) {
      throw new Error('Database file not found: data.db or data.db-wal');
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
    
    const backupFolderName = path.join(backupDir, `${year}-${month}-${day}_${hour}-${minute}-${second}`);
    ensureDirSync(backupFolderName);
    const backupDbPath = path.join(backupFolderName, 'data.db');
    const backupWalPath = path.join(backupFolderName, 'data.db-wal');

    await fs.copyFile(sourceDbPath, backupDbPath);
    await fs.copyFile(sourceDbWalPath, backupWalPath);

    logger.info('Database backup successful');

    return backupDbPath + backupWalPath;
  } catch (error) {
    const err = error as Error;
    logger.error('Database backup failed', {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
}
