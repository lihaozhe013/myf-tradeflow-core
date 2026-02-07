import fs from "fs";
import Database from "better-sqlite3";
import { initSql } from "@/utils/dbSchema";
import { resolveFilesInDataPath, appConfigPath } from "@/utils/paths";

const dbPath: string = resolveFilesInDataPath("data.db");

function getDatabaseType(): string {
  try {
    if (fs.existsSync(appConfigPath)) {
      const config = JSON.parse(fs.readFileSync(appConfigPath, "utf8"));
      return config.database?.type || 'sqlite';
    }
  } catch (e) { /* ignore */ }
  return 'sqlite';
}

/**
 * Connect to data.db with multi-threading support (PM2 cluster / Kubernetes)
 * @returns {Database.Database}
 */
function initializeDatabase(): Database.Database {
  if (getDatabaseType() === 'postgresql') {
    console.log("App configured for PostgreSQL. Skipping Legacy SQLite initialization.");
    // Return a dummy object to satisfy the type, but methods will fail if called.
    // This assumes usages are guarded or Migrated to Prisma.
    return {} as Database.Database;
  }

  const dbExists: boolean = fs.existsSync(dbPath);
  
  try {
    const db = new Database(dbPath);
    
    // Enable WAL mode for concurrent reads and queued writes
    // WAL mode allows multiple readers and one writer simultaneously
    db.pragma('journal_mode = WAL');
    
    // Set busy timeout to 5 seconds (5000ms)
    // This makes write operations wait up to 5s if database is locked
    // Instead of immediately throwing SQLITE_BUSY error
    db.pragma('busy_timeout = 5000');
    
    // Optional: Improve performance for WAL mode
    db.pragma('synchronous = NORMAL'); // Faster than FULL, still safe with WAL
    
    // Optional: Set cache size (negative = KB, positive = pages)
    // -64000 = 64MB cache
    db.pragma('cache_size = -64000');
    
    if (!dbExists) {
      db.exec(initSql);
      console.log("Database init completed!");
      console.log(`Worker PID ${process.pid}: Database initialized with WAL mode`);
    } else {
      console.log(`Worker PID ${process.pid}: Database Connected with WAL mode!`);
    }
    
    // Log configuration for verification
    const journalMode = db.pragma('journal_mode', { simple: true });
    const busyTimeout = db.pragma('busy_timeout', { simple: true });
    console.log(`Database config: journal_mode=${journalMode}, busy_timeout=${busyTimeout}ms`);
    
    return db;
  } catch (err) {
    const error = err as Error;
    console.error(`Worker PID ${process.pid}: Database connection failed:`, error.message);
    process.exit(1);
  }
}

const db: Database.Database = initializeDatabase();

export default db;
