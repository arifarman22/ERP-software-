// Re-export from modular auth system
export {
  authenticate,
  refreshAccessToken,
  logout,
  verifyAccessToken,
  withAuth,
  withPermission,
  withRoles,
  getCurrentUser,
  hasPermission,
  getPermissions,
  AUTH_CONFIG,
} from "./auth/index";
