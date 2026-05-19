import { Role } from "@prisma/client";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: string[];
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type SessionInfo = {
  id: string;
  ipAddress: string | null;
  userAgent: string | null;
  lastActiveAt: Date;
  createdAt: Date;
};
