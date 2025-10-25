import fs from "fs";
import sqlite3 from "sqlite3";
import { initSql } from "@/utils/dbSchema";
import { resolveFilesInDataPath } from "@/utils/paths";

const sqlite3Verbose = sqlite3.verbose();
const dbPath: string = resolveFilesInDataPath("data.db");

/**
 * Connect to data.db
 * @returns {sqlite3.Database}
 */
function initializeDatabase(): sqlite3.Database {
  const dbExists: boolean = fs.existsSync(dbPath);
  const db = new sqlite3Verbose.Database(dbPath, (err: Error | null) => {
    if (err) {
      console.error("Database connection failed:", err.message);
      process.exit(1);
    }
    if (!dbExists) {
      db.exec(initSql, (execErr: Error | null) => {
        if (execErr) {
          console.error("Database init failed:", execErr.message);
        } else {
          console.log("Database init completed!");
        }
      });
    } else {
      console.log("Database Connected!");
    }
  });
  return db;
}

export default initializeDatabase();
