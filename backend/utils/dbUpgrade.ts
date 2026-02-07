/**
 * Database Field Check
 * Automatically checking database structures
 */

import Database from "better-sqlite3";
import fs from "fs";
import { initSql } from "@/utils/dbSchema";
import { resolveFilesInDataPath, appConfigPath } from "@/utils/paths";

export function ensureAllTablesAndColumns(): void {
  try {
    if (fs.existsSync(appConfigPath)) {
      const config = JSON.parse(fs.readFileSync(appConfigPath, "utf8"));
      if (config.database?.type === 'postgresql') {
        console.log("PostgreSQL detected. Skipping SQLite table upgrades.");
        return;
      }
    }
  } catch (e) {}

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
