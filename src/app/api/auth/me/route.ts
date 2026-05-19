import { NextRequest, NextResponse } from "next/server";
import { withAuth, type AuthenticatedRequest, getPermissions, getLoginHistory } from "@/lib/auth/index";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  return withAuth(req, async (authReq: AuthenticatedRequest) => {
    const user = await db.user.findUnique({
      where: { id: authReq.user.userId },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const permissions = getPermissions(user.role as Role);
    const recentLogins = await getLoginHistory(user.id, 5);

    return NextResponse.json({
      success: true,
      data: { ...user, permissions, recentLogins },
    });
  });
}
