export type UserRole = "admin" | "rrhh" | "lectura";

export type AppUser = {
  username: string;
  passwordHash: string;
  role: UserRole;
  displayName: string;
};

export type Session = {
  username: string;
  role: UserRole;
  displayName: string;
  loginAt: number;
  expiresAt: number;
};

export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours
export const SESSION_KEY = "tcr_session";
