import { NextRequest, NextResponse } from "next/server";
import { refreshAccessToken, AUTH_CONFIG } from "@/lib/auth/index";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get(AUTH_CONFIG.cookies.refreshToken)?.value;
    if (!refreshToken) {
      return NextResponse.json({ success: false, error: "No refresh token" }, { status: 401 });
    }

    const result = await refreshAccessToken(refreshToken);

    const response = NextResponse.json({ success: true });

    response.cookies.set(AUTH_CONFIG.cookies.accessToken, result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: AUTH_CONFIG.jwt.accessTokenExpiryMs / 1000,
    });

    response.cookies.set(AUTH_CONFIG.cookies.refreshToken, result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/refresh",
      maxAge: AUTH_CONFIG.jwt.refreshTokenExpiryMs / 1000,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Refresh failed";
    const response = NextResponse.json({ success: false, error: message }, { status: 401 });
    response.cookies.delete(AUTH_CONFIG.cookies.accessToken);
    response.cookies.delete(AUTH_CONFIG.cookies.refreshToken);
    return response;
  }
}
