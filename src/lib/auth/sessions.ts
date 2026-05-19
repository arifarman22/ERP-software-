import { db } from "@/lib/db";
import { AUTH_CONFIG } from "./config";

export async function createSession(userId: string, token: string, ip?: string, userAgent?: string) {
  // Enforce max concurrent sessions
  const activeSessions = await db.session.count({
    where: { userId, isActive: true, expiresAt: { gt: new Date() } },
  });

  if (activeSessions >= AUTH_CONFIG.session.maxConcurrent) {
    // Revoke oldest session
    const oldest = await db.session.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: "asc" },
    });
    if (oldest) {
      await db.session.update({ where: { id: oldest.id }, data: { isActive: false } });
    }
  }

  return db.session.create({
    data: {
      userId,
      token,
      ipAddress: ip,
      userAgent: userAgent?.substring(0, 256),
      expiresAt: new Date(Date.now() + AUTH_CONFIG.jwt.refreshTokenExpiryMs),
    },
  });
}

export async function validateSession(sessionId: string): Promise<boolean> {
  const session = await db.session.findUnique({ where: { id: sessionId } });
  if (!session || !session.isActive || session.expiresAt < new Date()) return false;

  // Update last active
  await db.session.update({
    where: { id: sessionId },
    data: { lastActiveAt: new Date() },
  });
  return true;
}

export async function revokeSession(sessionId: string) {
  await db.session.update({ where: { id: sessionId }, data: { isActive: false } });
}

export async function revokeAllUserSessions(userId: string) {
  await db.session.updateMany({
    where: { userId, isActive: true },
    data: { isActive: false },
  });
  await db.refreshToken.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });
}

export async function getActiveSessions(userId: string) {
  return db.session.findMany({
    where: { userId, isActive: true, expiresAt: { gt: new Date() } },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      lastActiveAt: true,
      createdAt: true,
    },
    orderBy: { lastActiveAt: "desc" },
  });
}
