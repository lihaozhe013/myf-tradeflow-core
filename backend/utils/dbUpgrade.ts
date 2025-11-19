/**
 * Database Field Check
 * Automatically checking database structures
 */

import sqlite3 from "sqlite3";
import { initSql } from "@/utils/dbSchema";
import { resolveFilesInDataPath } from "@/utils/paths";

const sqlite = sqlite3.verbose();

export function ensureAllTablesAndColumns(): void {
  const dbPath: string = resolveFilesInDataPath("data.db");
  const dbInstance: sqlite3.Database = new sqlite.Database(dbPath);

  // base table structure creation
  dbInstance.exec(initSql, (err: Error | null) => {
    if (err) {
      console.error("Database Structure Check Failed:", err.message);
      dbInstance.close();
      return;
    }
  });
}
