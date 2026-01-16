import path from 'path';
import { resolveFilesInDataPath, ensureDirSync } from '@/utils/paths.js';
import { logger } from '@/utils/logger.js';
import db from '@/db.js';

export async function backupDatabase(): Promise<string> {
  try {
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

    // Use better-sqlite3 backup API to create a single file backup
    // This automatically handles WAL merging and consistency
    await db.backup(backupDbPath);

    logger.info('Database backup successful');

    return backupDbPath;
  } catch (error) {
    const err = error as Error;
    logger.error('Database backup failed', {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
}
