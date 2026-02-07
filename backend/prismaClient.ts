import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import { appConfigPath, resolveFilesInDataPath } from "@/utils/paths.js";
import { logger } from "@/utils/logger.js";

let prismaInstance: PrismaClient | null = null;

function getDatabaseConfig() {
  try {
    if (fs.existsSync(appConfigPath)) {
      const configContent = fs.readFileSync(appConfigPath, "utf8");
      const config = JSON.parse(configContent);
      return config.database || {};
    }
    return {};
  } catch (error) {
    logger.warn("Failed to read appConfig for database configuration, using defaults.");
    return {};
  }
}

function createPrismaClient() {
  const dbConfig = getDatabaseConfig();
  let url = "";

  // Check if we are configured for Postgres
  // Note: Changing provider requires updating schema.prisma and running `prisma generate`
  if (dbConfig.type === 'postgresql') {
    const { user, password, host, port, dbName } = dbConfig;
    url = `postgresql://${user}:${password}@${host}:${port}/${dbName}`;
    logger.info(`Configured for PostgreSQL: ${host}:${port}/${dbName}`);
    // Note: If the actual schema.prisma provider is 'sqlite', this might throw at runtime.
    // The user needs to manually update schema.prisma when switching to Postgres.
  } else {
    // Default to SQLite
    const dbPath = resolveFilesInDataPath("data.db");
    url = `file:${dbPath}?connection_limit=1`; 
    // connection_limit=1 is good for SQLite WAL mode with limited concurrency handling in Node
    logger.info(`Initializing Prisma with SQLite: ${dbPath}`);
  }

  const log: any[] = process.env['NODE_ENV'] === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'];

  return new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
    log,
  });
}

export const prisma = prismaInstance || (prismaInstance = createPrismaClient());

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
