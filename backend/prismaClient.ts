import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { config } from "@/utils/paths";
import { logger } from "@/utils/logger";

let prismaInstance: PrismaClient | null = null;

function getDatabaseConfig() {
  return config.database || {};
}

function createPrismaClient() {
  const dbConfig = getDatabaseConfig();
  
  // Default to nothing if not postgres, or throw
  const { user, password, host, port, dbName } = dbConfig;
  const connectionString = `postgresql://${user}:${password}@${host}:${port}/${dbName}`;
  
  logger.info(`Configured for PostgreSQL: ${host}:${port}/${dbName}`);

  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);

  const log: any[] = process.env['NODE_ENV'] === 'development' 
    ? ['query', 'info', 'warn', 'error'] 
    : ['error'];

  return new PrismaClient({
    adapter,
    // @ts-ignore
    log,
  });
}

export const prisma = prismaInstance || (prismaInstance = createPrismaClient());

// Handle graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
