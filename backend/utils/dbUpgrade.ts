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
    // After ensuring base tables, attempt to rename legacy columns if present
    const renameIfPresent = (
      table: string,
      fromCol: string,
      toCol: string
    ): Promise<void> => {
      return new Promise((resolve) => {
        dbInstance.all(`PRAGMA table_info(${table})`, (e, rows: any[]) => {
          if (e) {
            return resolve();
          }
          const hasFrom = rows?.some((r) => r?.name === fromCol);
          const hasTo = rows?.some((r) => r?.name === toCol);
          if (hasFrom && !hasTo) {
            dbInstance.exec(
              `ALTER TABLE ${table} RENAME COLUMN ${fromCol} TO ${toCol};`,
              (renameErr: Error | null) => {
                if (renameErr) {
                  console.warn(
                    `Column rename skipped for ${table}: ${fromCol} -> ${toCol}:`,
                    renameErr.message
                  );
                } else {
                  console.log(
                    `Column renamed for ${table}: ${fromCol} -> ${toCol}`
                  );
                }
                resolve();
              }
            );
          } else {
            resolve();
          }
        });
      });
    };

    // Perform renames for both inbound and outbound tables
    renameIfPresent("inbound_records", "invoice_image_url", "receipt_number")
      .then(() =>
        renameIfPresent(
          "outbound_records",
          "invoice_image_url",
          "receipt_number"
        )
      )
      .finally(() => dbInstance.close());
  });
}
