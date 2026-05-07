/**
 * User registry for local-first auth.
 * Passwords are stored as SHA-256 hex hashes.
 * To generate a hash: crypto.subtle.digest("SHA-256", new TextEncoder().encode("password"))
 *
 * Default credentials (change before deploying):
 *   KataS / Tota95  → admin
 *
 * SECURITY NOTE: This is local-first only. For real multi-user security, add a backend.
 */
import type { AppUser } from "./authTypes";

// sha256("Tota95") = pre-computed below. Do NOT store plain passwords here.
// Generated with: [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('Tota95')))].map(b=>b.toString(16).padStart(2,'0')).join('')
const USERS: AppUser[] = [
  {
    username: "KataS",
    passwordHash: "6bb81bcab8a6481a4ef420f50ee63d3d249aa0394451dd6de711f8a86498c900",
    role: "admin",
    displayName: "Katarina S.",
  },
];

export function getUserRegistry(): AppUser[] {
  return USERS;
}
