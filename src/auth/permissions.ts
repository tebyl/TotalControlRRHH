import type { UserRole } from "./authTypes";

export type Permission =
  | "record:create"
  | "record:edit"
  | "record:delete"
  | "record:close"
  | "record:duplicate"
  | "data:import"
  | "data:export:full"
  | "data:export:summary"
  | "data:export:anonymized"
  | "backup:create"
  | "backup:restore"
  | "config:edit";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    "record:create", "record:edit", "record:delete", "record:close", "record:duplicate",
    "data:import", "data:export:full", "data:export:summary", "data:export:anonymized",
    "backup:create", "backup:restore", "config:edit",
  ],
  rrhh: [
    "record:create", "record:edit", "record:close", "record:duplicate",
    "data:export:summary", "data:export:anonymized",
    "backup:create",
  ],
  lectura: [
    "data:export:anonymized",
  ],
};

export function can(role: UserRole | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
