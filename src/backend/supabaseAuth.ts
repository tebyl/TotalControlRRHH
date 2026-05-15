import { supabase, SUPABASE_CONFIGURED } from "./supabaseClient";
import type { UserRole } from "../auth/authTypes";

// Each user gets a deterministic email: username@controlrh.internal
// The Supabase password is their SHA-256 password hash — already available after local auth.
// This makes Supabase auth fully derivable from local credentials, no extra secrets.

function toEmail(username: string): string {
  return `${username.toLowerCase()}@controlrh.internal`;
}

export type SupabaseAuthResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

export async function supabaseSignIn(
  username: string,
  passwordHash: string
): Promise<SupabaseAuthResult> {
  if (!SUPABASE_CONFIGURED) return { ok: false, error: "Supabase no configurado" };

  const email = toEmail(username);

  // Try sign-in first
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: passwordHash,
  });

  if (!error && data.user) {
    return { ok: true, userId: data.user.id };
  }

  // Attempt sign-up on any sign-in failure (covers 422 invalid email format,
  // 400 invalid_credentials, and "user not found" variants)
  {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: passwordHash,
      options: { data: { username, role: "admin" as UserRole } },
    });
    if (!signUpError && signUpData.user) {
      return { ok: true, userId: signUpData.user.id };
    }
    return { ok: false, error: signUpError?.message ?? "Error al crear usuario" };
  }
}

export async function supabaseSignOut(): Promise<void> {
  if (!SUPABASE_CONFIGURED) return;
  await supabase.auth.signOut();
}

export async function getSupabaseUserId(): Promise<string | null> {
  if (!SUPABASE_CONFIGURED) return null;
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}
