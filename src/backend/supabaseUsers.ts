import { supabase, SUPABASE_CONFIGURED } from "./supabaseClient";
import type { UserRole } from "../auth/authTypes";

export type RemoteUser = {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  display_name: string;
  active: boolean;
};

export type UserResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// Read-only: used during login (no auth required — anon key policy)
export async function findRemoteUser(username: string): Promise<RemoteUser | null> {
  if (!SUPABASE_CONFIGURED) return null;
  const { data, error } = await supabase
    .from("app_users")
    .select("id, username, password_hash, role, display_name, active")
    .eq("username", username)
    .eq("active", true)
    .maybeSingle();
  if (error || !data) return null;
  return data as RemoteUser;
}

export async function listRemoteUsers(): Promise<UserResult<RemoteUser[]>> {
  if (!SUPABASE_CONFIGURED) return { ok: true, data: [] };
  const { data, error } = await supabase
    .from("app_users")
    .select("id, username, password_hash, role, display_name, active")
    .order("created_at", { ascending: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as RemoteUser[] };
}

export async function createRemoteUser(
  username: string,
  passwordHash: string,
  role: UserRole,
  displayName: string
): Promise<UserResult<RemoteUser>> {
  if (!SUPABASE_CONFIGURED) return { ok: false, error: "Supabase no configurado" };
  const { data, error } = await supabase
    .from("app_users")
    .insert({ username, password_hash: passwordHash, role, display_name: displayName })
    .select()
    .single();
  if (error || !data) return { ok: false, error: error?.message ?? "Error creando usuario" };
  return { ok: true, data: data as RemoteUser };
}

export async function updateRemoteUser(
  id: string,
  fields: Partial<Pick<RemoteUser, "role" | "display_name" | "active" | "password_hash">>
): Promise<UserResult<void>> {
  if (!SUPABASE_CONFIGURED) return { ok: false, error: "Supabase no configurado" };
  const { error } = await supabase.from("app_users").update(fields).eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

export async function deleteRemoteUser(id: string): Promise<UserResult<void>> {
  if (!SUPABASE_CONFIGURED) return { ok: false, error: "Supabase no configurado" };
  const { error } = await supabase.from("app_users").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}
