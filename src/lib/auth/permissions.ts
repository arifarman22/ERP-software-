import { Role } from "@prisma/client";

export type Permission =
  | "dashboard:view"
  | "employees:view"
  | "employees:create"
  | "employees:edit"
  | "employees:delete"
  | "production:view"
  | "production:create"
  | "production:edit"
  | "production:delete"
  | "inventory:view"
  | "inventory:create"
  | "inventory:edit"
  | "inventory:transfer"
  | "sales:view"
  | "sales:create"
  | "sales:edit"
  | "sales:delete"
  | "invoices:view"
  | "invoices:create"
  | "invoices:edit"
  | "dealers:view"
  | "dealers:create"
  | "dealers:edit"
  | "reports:view"
  | "reports:export"
  | "users:manage"
  | "audit:view";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "dashboard:view",
    "employees:view", "employees:create", "employees:edit", "employees:delete",
    "production:view", "production:create", "production:edit", "production:delete",
    "inventory:view", "inventory:create", "inventory:edit", "inventory:transfer",
    "sales:view", "sales:create", "sales:edit", "sales:delete",
    "invoices:view", "invoices:create", "invoices:edit",
    "dealers:view", "dealers:create", "dealers:edit",
    "reports:view", "reports:export",
    "users:manage", "audit:view",
  ],
  MANAGER: [
    "dashboard:view",
    "employees:view", "employees:create", "employees:edit",
    "production:view", "production:create", "production:edit",
    "inventory:view", "inventory:create", "inventory:edit", "inventory:transfer",
    "sales:view", "sales:create", "sales:edit",
    "invoices:view", "invoices:create", "invoices:edit",
    "dealers:view", "dealers:create", "dealers:edit",
    "reports:view", "reports:export",
  ],
  SUPERVISOR: [
    "dashboard:view",
    "employees:view",
    "production:view", "production:create", "production:edit",
    "inventory:view",
    "reports:view",
  ],
  WORKER: [
    "dashboard:view",
  ],
  DEALER: [
    "dashboard:view",
    "sales:view",
    "invoices:view",
  ],
};

export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  const rolePerms = ROLE_PERMISSIONS[role] ?? [];
  return permissions.some((p) => rolePerms.includes(p));
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  const rolePerms = ROLE_PERMISSIONS[role] ?? [];
  return permissions.every((p) => rolePerms.includes(p));
}
