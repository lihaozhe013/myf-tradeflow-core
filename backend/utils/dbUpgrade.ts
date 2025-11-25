/**
 * Database Field Check
 * Automatically checking database structures
 */

import Database from "better-sqlite3";
import { initSql } from "@/utils/dbSchema";
import { resolveFilesInDataPath } from "@/utils/paths";

export function ensureAllTablesAndColumns(): void {
  const dbPath: string = resolveFilesInDataPath("data.db");
  
  try {
    const dbInstance = new Database(dbPath);
    
    // base table structure creation
    dbInstance.exec(initSql);
    
    dbInstance.close();
  } catch (err) {
    const error = err as Error;
    console.error("Database Structure Check Failed:", error.message);
    throw error;
  }
}
