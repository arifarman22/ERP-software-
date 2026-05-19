import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { AUTH_CONFIG } from "./config";
import { Role } from "@prisma/client";

export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: Role;
  sessionId: string;
}

export interface RefreshTokenPayload extends JWTPayload {
  userId: string;
  family: string;
  sessionId: string;
}

function getAccessSecret() {
  return new TextEncoder().encode(AUTH_CONFIG.jwt.accessTokenSecret);
}

function getRefreshSecret() {
  return new TextEncoder().encode(AUTH_CONFIG.jwt.refreshTokenSecret);
}

export async function signAccessToken(payload: Omit<TokenPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(AUTH_CONFIG.jwt.accessTokenExpiry)
    .sign(getAccessSecret());
}

export async function signRefreshToken(payload: Omit<RefreshTokenPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(AUTH_CONFIG.jwt.refreshTokenExpiry)
    .sign(getRefreshSecret());
}

export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getAccessSecret());
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getRefreshSecret());
    return payload as RefreshTokenPayload;
  } catch {
    return null;
  }
}
