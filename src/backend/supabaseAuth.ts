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

  if (!error && data.user) return { ok: true, userId: data.user.id };

  // First time: create the user in Supabase (auto sign-up)
  if (error?.message?.includes("Invalid login credentials")) {
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

  return { ok: false, error: error?.message ?? "Error desconocido" };
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
