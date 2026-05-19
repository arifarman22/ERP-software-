import { PrismaClient } from "@prisma/client";

function createPrismaClient(): PrismaClient {

  if (!process.env.DATABASE_URL) {
    return new PrismaClient();
  }

  // Use Neon serverless adapter only at runtime
  const { PrismaNeon } = require("@prisma/adapter-neon");
  const { Pool, neonConfig } = require("@neondatabase/serverless");

  neonConfig.poolQueryViaFetch = true;

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  const adapter = new PrismaNeon(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    transactionOptions: {
      maxWait: 5000,
      timeout: 10000,
    },
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

export async function checkDatabaseHealth(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}
