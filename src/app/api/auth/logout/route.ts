import { NextRequest, NextResponse } from "next/server";
import { logout, getCurrentUser, AUTH_CONFIG } from "@/lib/auth/index";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (user) {
      await logout(user.sessionId, user.userId);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete(AUTH_CONFIG.cookies.accessToken);
    response.cookies.delete(AUTH_CONFIG.cookies.refreshToken);
    return response;
  } catch {
    const response = NextResponse.json({ success: true });
    response.cookies.delete(AUTH_CONFIG.cookies.accessToken);
    response.cookies.delete(AUTH_CONFIG.cookies.refreshToken);
    return response;
  }
}
