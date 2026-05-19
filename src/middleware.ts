import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_ROUTES = ["/login", "/register", "/api/auth/login", "/api/auth/register", "/api/auth/refresh"];
const AUTH_COOKIE = "tea-erp-access";

const ROUTE_PERMISSIONS: Record<string, string[]> = {
  "/employees": ["ADMIN", "MANAGER"],
  "/production": ["ADMIN", "MANAGER", "SUPERVISOR"],
  "/inventory": ["ADMIN", "MANAGER"],
  "/sales": ["ADMIN", "MANAGER", "DEALER"],
  "/invoices": ["ADMIN", "MANAGER", "DEALER"],
  "/dealers": ["ADMIN", "MANAGER"],
  "/reports": ["ADMIN", "MANAGER", "SUPERVISOR"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Allow static assets
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  // Extract token
  const token =
    req.cookies.get(AUTH_COOKIE)?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Verify JWT (lightweight check in middleware — full validation in guards)
  try {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, secret);

    // Role-based route protection
    const role = payload.role as string;
    for (const [route, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
      if (pathname.startsWith(route) && !allowedRoles.includes(role)) {
        if (pathname.startsWith("/api/")) {
          return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    // Redirect authenticated users away from auth pages
    if (["/login", "/register"].includes(pathname)) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Attach user info to headers for downstream use
    const response = NextResponse.next();
    response.headers.set("x-user-id", payload.userId as string);
    response.headers.set("x-user-role", payload.role as string);
    return response;
  } catch {
    // Token expired or invalid — redirect to login
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Token expired" }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL("/login", req.url));
    response.cookies.delete(AUTH_COOKIE);
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
