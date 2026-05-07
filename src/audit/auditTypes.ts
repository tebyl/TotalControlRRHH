export type AuditAction =
  | "login" | "logout"
  | "record:create" | "record:edit" | "record:delete" | "record:close" | "record:duplicate"
  | "data:import" | "data:export" | "backup:create" | "backup:restore";

export type AuditEntry = {
  id: string;
  timestamp: string;
  username: string;
  action: AuditAction;
  module?: string;
  recordId?: string;
  detail?: string;
};
