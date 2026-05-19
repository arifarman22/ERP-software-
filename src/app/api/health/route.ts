import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const dbHealth = await checkDatabaseHealth();

  const status = dbHealth.ok ? 200 : 503;
  return NextResponse.json({
    status: dbHealth.ok ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    services: {
      database: { ...dbHealth, provider: "neon" },
      runtime: { region: process.env.VERCEL_REGION || "local" },
    },
  }, { status });
}
