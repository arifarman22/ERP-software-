import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";

// ─── Neon Serverless Configuration ──────────────────────────────────────────
// Required for Vercel Edge/Serverless: uses HTTP fetch instead of TCP sockets

neonConfig.poolQueryViaFetch = true;

// ─── Connection Pool Settings ───────────────────────────────────────────────
// Neon free tier: 100 connections max
// Vercel serverless: each function instance gets its own pool
// Keep pool small per instance to avoid exhaustion across concurrent functions

const POOL_CONFIG = {
  connectionString: process.env.DATABASE_URL!,
  max: 5,                    // Max connections per serverless instance
  idleTimeoutMillis: 30000,  // Close idle connections after 30s
  connectionTimeoutMillis: 10000, // Fail fast if can't connect in 10s
};

// ─── Prisma Client Factory ──────────────────────────────────────────────────

function createPrismaClient(): PrismaClient {
  const pool = new Pool(POOL_CONFIG);
  const adapter = new PrismaNeon(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development"
      ? ["query", "error", "warn"]
      : ["error"],
    transactionOptions: {
      maxWait: 5000,   // Max time to wait for transaction slot
      timeout: 10000,  // Max transaction execution time
    },
  });
}

// ─── Singleton Pattern ──────────────────────────────────────────────────────
// In development: cache on globalThis to survive HMR
// In production (Vercel): each cold start creates one instance per function
//   - globalThis persists across warm invocations of the same instance
//   - Prevents creating new pools on every request within same instance

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

// ─── Graceful Shutdown ──────────────────────────────────────────────────────
// Ensures connections are released when the process exits

async function shutdown() {
  await db.$disconnect();
}

if (typeof process !== "undefined") {
  process.on("beforeExit", shutdown);
}

// ─── Health Check Utility ───────────────────────────────────────────────────

export async function checkDatabaseHealth(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: Date.now() - start };
  }
}
