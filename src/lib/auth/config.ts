export const AUTH_CONFIG = {
  jwt: {
    get accessTokenSecret() { return process.env.JWT_ACCESS_SECRET || "fallback-dev-secret-change-in-production"; },
    get refreshTokenSecret() { return process.env.JWT_REFRESH_SECRET || "fallback-dev-refresh-secret-change-in-production"; },
    accessTokenExpiry: "15m" as const,
    refreshTokenExpiry: "7d" as const,
    accessTokenExpiryMs: 15 * 60 * 1000,
    refreshTokenExpiryMs: 7 * 24 * 60 * 60 * 1000,
  },
  session: {
    maxConcurrent: 5,
    inactivityTimeout: 30 * 60 * 1000,
  },
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000,
    bcryptRounds: 12,
  },
  cookies: {
    accessToken: "tea-erp-access",
    refreshToken: "tea-erp-refresh",
  },
} as const;
