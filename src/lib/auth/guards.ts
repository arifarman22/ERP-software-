import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken, type TokenPayload } from "./tokens";
import { validateSession } from "./sessions";
import { hasPermission, hasAnyPermission, type Permission } from "./permissions";
import { AUTH_CONFIG } from "./config";
import { Role } from "@prisma/client";

export type AuthenticatedRequest = NextRequest & {
  user: TokenPayload;
};

// Extract token from cookie or Authorization header
function extractToken(req: NextRequest): string | null {
  const cookie = req.cookies.get(AUTH_CONFIG.cookies.accessToken)?.value;
  if (cookie) return cookie;

  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);

  return null;
}

// Core auth guard — verifies JWT + session validity
export async function withAuth(
  req: NextRequest,
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const token = extractToken(req);
  if (!token) {
    return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 });
  }

  const sessionValid = await validateSession(payload.sessionId);
  if (!sessionValid) {
    return NextResponse.json({ success: false, error: "Session expired" }, { status: 401 });
  }

  (req as AuthenticatedRequest).user = payload;
  return handler(req as AuthenticatedRequest);
}

// Permission guard — checks specific permission
export function withPermission(permission: Permission) {
  return async (req: NextRequest, handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
    return withAuth(req, async (authReq) => {
      if (!hasPermission(authReq.user.role as Role, permission)) {
        return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
      }
      return handler(authReq);
    });
  };
}

// Role guard — checks if user has one of the allowed roles
export function withRoles(roles: Role[]) {
  return async (req: NextRequest, handler: (req: AuthenticatedRequest) => Promise<NextResponse>) => {
    return withAuth(req, async (authReq) => {
      if (!roles.includes(authReq.user.role as Role)) {
        return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 });
      }
      return handler(authReq);
    });
  };
}

// Helper to get current user from request in API routes
export async function getCurrentUser(req: NextRequest): Promise<TokenPayload | null> {
  const token = extractToken(req);
  if (!token) return null;
  return verifyAccessToken(token);
}
