import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest } from "@/lib/auth/index";
import { getActiveSessions, revokeSession, revokeAllUserSessions } from "@/lib/auth/index";

export async function GET(req: NextRequest) {
  return withAuth(req, async (authReq: AuthenticatedRequest) => {
    const sessions = await getActiveSessions(authReq.user.userId);
    return NextResponse.json({ success: true, data: sessions });
  });
}

export async function DELETE(req: NextRequest) {
  return withAuth(req, async (authReq: AuthenticatedRequest) => {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      await revokeSession(sessionId);
    } else {
      await revokeAllUserSessions(authReq.user.userId);
    }

    return NextResponse.json({ success: true });
  });
}
