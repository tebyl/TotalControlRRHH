import type { AuditAction, AuditEntry } from "./auditTypes";
import { getSession } from "../auth/authService";

const AUDIT_KEY = "tcr_audit_log";
const MAX_ENTRIES = 500;

function genAuditId(): string {
  return `a_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function logAudit(action: AuditAction, opts?: { module?: string; recordId?: string; detail?: string }): void {
  try {
    const session = getSession();
    const entry: AuditEntry = {
      id: genAuditId(),
      timestamp: new Date().toISOString(),
      username: session?.username ?? "anon",
      action,
      ...opts,
    };

    const raw = localStorage.getItem(AUDIT_KEY);
    const entries: AuditEntry[] = raw ? JSON.parse(raw) : [];
    entries.push(entry);

    // Keep only the last MAX_ENTRIES
    if (entries.length > MAX_ENTRIES) entries.splice(0, entries.length - MAX_ENTRIES);
    localStorage.setItem(AUDIT_KEY, JSON.stringify(entries));
  } catch {
    // Audit must never crash the app
  }
}

export function getAuditLog(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearAuditLog(): void {
  localStorage.removeItem(AUDIT_KEY);
}
