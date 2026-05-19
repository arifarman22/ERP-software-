export const AUTH_CONFIG = {
  jwt: {
    accessTokenSecret: process.env.JWT_ACCESS_SECRET!,
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET!,
    accessTokenExpiry: "15m",
    refreshTokenExpiry: "7d",
    accessTokenExpiryMs: 15 * 60 * 1000,
    refreshTokenExpiryMs: 7 * 24 * 60 * 60 * 1000,
  },
  session: {
    maxConcurrent: 5,
    inactivityTimeout: 30 * 60 * 1000, // 30 min
  },
  security: {
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 min
    bcryptRounds: 12,
  },
  cookies: {
    accessToken: "tea-erp-access",
    refreshToken: "tea-erp-refresh",
  },
} as const;
