import type { Session } from "./authTypes";
import { SESSION_DURATION_MS, SESSION_KEY } from "./authTypes";
import { supabaseSignIn, supabaseSignOut } from "../backend/supabaseAuth";

async function sha256hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function login(username: string, password: string): Promise<Session | null> {
  const { getUserRegistry } = await import("./authUsers");
  const users = getUserRegistry();
  const hash = await sha256hex(password);
  const user = users.find(u => u.username === username && u.passwordHash === hash);
  if (!user) return null;

  // Fire-and-forget: establish Supabase session in background.
  // Local session is always the source of truth for offline support.
  supabaseSignIn(username, hash).catch(() => {});

  const now = Date.now();
  const session: Session = {
    username: user.username,
    role: user.role,
    displayName: user.displayName,
    loginAt: now,
    expiresAt: now + SESSION_DURATION_MS,
  };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: Session = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function logout(): void {
  sessionStorage.removeItem(SESSION_KEY);
  supabaseSignOut().catch(() => {});
}

export function refreshSession(): void {
  const session = getSession();
  if (!session) return;
  session.expiresAt = Date.now() + SESSION_DURATION_MS;
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}
