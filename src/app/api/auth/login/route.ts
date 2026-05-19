import { NextRequest, NextResponse } from "next/server";
import { authenticate, AUTH_CONFIG } from "@/lib/auth/index";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await authenticate(body, ip, userAgent);

    const response = NextResponse.json({
      success: true,
      data: { user: result.user },
    });

    // Set HTTP-only cookies
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
    const message = error instanceof Error ? error.message : "Authentication failed";
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }
}
