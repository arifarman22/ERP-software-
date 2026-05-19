import { db } from "@/lib/db";
import { compare, hash } from "bcryptjs";
import { randomUUID } from "crypto";
import { AUTH_CONFIG } from "./config";
import { signAccessToken, signRefreshToken } from "./tokens";
import { createSession } from "./sessions";
import { logLoginAttempt } from "./audit";
import { loginSchema } from "@/lib/validators/auth";

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: { id: string; name: string; email: string; role: string };
};

export async function authenticate(
  credentials: unknown,
  ip?: string,
  userAgent?: string
): Promise<AuthResult> {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) {
    await logLoginAttempt({ email: "unknown", success: false, ip, userAgent, reason: "Invalid input" });
    throw new Error("Invalid credentials format");
  }

  const { email, password } = parsed.data;

  // Check rate limiting (recent failed attempts)
  const recentFailures = await db.loginAudit.count({
    where: {
      email,
      success: false,
      createdAt: { gt: new Date(Date.now() - AUTH_CONFIG.security.lockoutDuration) },
    },
  });

  if (recentFailures >= AUTH_CONFIG.security.maxLoginAttempts) {
    await logLoginAttempt({ email, success: false, ip, userAgent, reason: "Account locked" });
    throw new Error("Account temporarily locked. Try again later.");
  }

  const user = await db.user.findUnique({ where: { email, isActive: true, deletedAt: null } });
  if (!user) {
    await logLoginAttempt({ email, success: false, ip, userAgent, reason: "User not found" });
    throw new Error("Invalid email or password");
  }

  const valid = await compare(password, user.password);
  if (!valid) {
    await logLoginAttempt({ email, userId: user.id, success: false, ip, userAgent, reason: "Wrong password" });
    throw new Error("Invalid email or password");
  }

  // Generate token family for refresh token rotation
  const family = randomUUID();
  const sessionToken = randomUUID();

  // Create session
  const session = await createSession(user.id, sessionToken, ip, userAgent);

  // Sign tokens
  const accessToken = await signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId: session.id,
  });

  const refreshToken = await signRefreshToken({
    userId: user.id,
    family,
    sessionId: session.id,
  });

  // Store refresh token
  await db.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      family,
      expiresAt: new Date(Date.now() + AUTH_CONFIG.jwt.refreshTokenExpiryMs),
    },
  });

  await logLoginAttempt({ email, userId: user.id, success: true, ip, userAgent });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

export async function refreshAccessToken(currentRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  const { verifyRefreshToken } = await import("./tokens");
  const payload = await verifyRefreshToken(currentRefreshToken);
  if (!payload) throw new Error("Invalid refresh token");

  // Find token in DB
  const storedToken = await db.refreshToken.findUnique({ where: { token: currentRefreshToken } });
  if (!storedToken || storedToken.isRevoked) {
    // Token reuse detected — revoke entire family (potential theft)
    if (storedToken) {
      await db.refreshToken.updateMany({
        where: { family: storedToken.family },
        data: { isRevoked: true },
      });
    }
    throw new Error("Token reuse detected");
  }

  // Validate session still active
  const session = await db.session.findUnique({ where: { id: payload.sessionId } });
  if (!session || !session.isActive) throw new Error("Session expired");

  // Revoke current refresh token (rotation)
  await db.refreshToken.update({ where: { id: storedToken.id }, data: { isRevoked: true } });

  // Get user
  const user = await db.user.findUnique({ where: { id: payload.userId, isActive: true } });
  if (!user) throw new Error("User not found");

  // Issue new token pair
  const accessToken = await signAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionId: payload.sessionId,
  });

  const newRefreshToken = await signRefreshToken({
    userId: user.id,
    family: storedToken.family,
    sessionId: payload.sessionId,
  });

  await db.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: user.id,
      family: storedToken.family,
      expiresAt: new Date(Date.now() + AUTH_CONFIG.jwt.refreshTokenExpiryMs),
    },
  });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(sessionId: string, userId: string) {
  await db.session.update({ where: { id: sessionId }, data: { isActive: false } });
  await db.refreshToken.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  });
}
