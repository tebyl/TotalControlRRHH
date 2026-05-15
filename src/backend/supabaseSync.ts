import { supabase, SUPABASE_CONFIGURED } from "./supabaseClient";
import type { AppData } from "../domain/types";

const TABLE = "app_data";

export type SyncResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function getUserId(): Promise<string | null> {
  // getSession() uses cached token — no network call, avoids race conditions
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

// Load AppData for the current authenticated user
export async function loadRemoteData(): Promise<SyncResult<AppData | null>> {
  if (!SUPABASE_CONFIGURED) return { ok: true, data: null };

  const userId = await getUserId();
  if (!userId) {
    console.warn("[Supabase] loadRemoteData: sin sesión");
    return { ok: true, data: null };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, data: data ? (data.data as AppData) : null };
}

// Save (upsert) AppData for the current authenticated user
export async function saveRemoteData(appData: AppData): Promise<SyncResult<void>> {
  if (!SUPABASE_CONFIGURED) return { ok: true, data: undefined };

  const userId = await getUserId();
  if (!userId) {
    console.warn("[Supabase] saveRemoteData: sin sesión, omitiendo");
    return { ok: false, error: "Sin sesión Supabase activa" };
  }

  const { error } = await supabase.from(TABLE).upsert(
    { user_id: userId, data: appData, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );

  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true, data: undefined };
}

// Subscribe to real-time changes from other devices
export function subscribeToRemoteChanges(
  onUpdate: (newData: AppData) => void
): () => void {
  if (!SUPABASE_CONFIGURED) return () => {};

  const channel = supabase
    .channel("app_data_changes")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: TABLE },
      (payload) => {
        const newData = (payload.new as { data: AppData }).data;
        if (newData) onUpdate(newData);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
