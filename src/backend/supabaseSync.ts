import { supabase, SUPABASE_CONFIGURED } from "./supabaseClient";
import type { AppData } from "../domain/types";

const TABLE = "app_data";

export type SyncResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// Load AppData for the current authenticated user
export async function loadRemoteData(): Promise<SyncResult<AppData | null>> {
  if (!SUPABASE_CONFIGURED) return { ok: true, data: null };

  const { data, error } = await supabase
    .from(TABLE)
    .select("data, updated_at")
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ? (data.data as AppData) : null };
}

// Save (upsert) AppData for the current authenticated user
export async function saveRemoteData(appData: AppData): Promise<SyncResult<void>> {
  if (!SUPABASE_CONFIGURED) return { ok: true, data: undefined };

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return { ok: false, error: "Sin sesión Supabase activa" };

  const { error } = await supabase.from(TABLE).upsert(
    { user_id: userId, data: appData, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

// Subscribe to remote changes made by other sessions/devices
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
