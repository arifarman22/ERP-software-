import { db } from "@/lib/db";

type LoginAuditInput = {
  email: string;
  userId?: string;
  success: boolean;
  ip?: string;
  userAgent?: string;
  reason?: string;
};

export async function logLoginAttempt({ email, userId, success, ip, userAgent, reason }: LoginAuditInput) {
  await db.loginAudit.create({
    data: {
      email,
      userId,
      success,
      ipAddress: ip,
      userAgent: userAgent?.substring(0, 256),
      reason,
    },
  });
}

export async function getLoginHistory(userId: string, limit = 20) {
  return db.loginAudit.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      success: true,
      ipAddress: true,
      userAgent: true,
      reason: true,
      createdAt: true,
    },
  });
}

export async function getFailedAttempts(email: string, since: Date) {
  return db.loginAudit.count({
    where: { email, success: false, createdAt: { gt: since } },
  });
}
