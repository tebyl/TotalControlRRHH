import { supabase, SUPABASE_CONFIGURED } from "./supabaseClient";
import { getCachedWorkspaceId } from "./supabaseWorkspace";
import type { AppData } from "../domain/types";

const TABLE = "app_data";

export type SyncResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// Load AppData for the current workspace
export async function loadRemoteData(): Promise<SyncResult<AppData | null>> {
  if (!SUPABASE_CONFIGURED) return { ok: true, data: null };

  const workspaceId = getCachedWorkspaceId();
  if (!workspaceId) return { ok: true, data: null };

  const { data, error } = await supabase
    .from(TABLE)
    .select("data, updated_at")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data ? (data.data as AppData) : null };
}

// Save (upsert) AppData for the current workspace
export async function saveRemoteData(appData: AppData): Promise<SyncResult<void>> {
  if (!SUPABASE_CONFIGURED) return { ok: true, data: undefined };

  const workspaceId = getCachedWorkspaceId();
  if (!workspaceId) return { ok: false, error: "Sin workspace activo" };

  const { error } = await supabase.from(TABLE).upsert(
    { workspace_id: workspaceId, data: appData, updated_at: new Date().toISOString() },
    { onConflict: "workspace_id" }
  );

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: undefined };
}

// Subscribe to real-time changes from collaborators in the same workspace
export function subscribeToRemoteChanges(
  workspaceId: string,
  onUpdate: (newData: AppData) => void
): () => void {
  if (!SUPABASE_CONFIGURED) return () => {};

  const channel = supabase
    .channel(`workspace_${workspaceId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: TABLE,
        filter: `workspace_id=eq.${workspaceId}`,
      },
      (payload) => {
        const newData = (payload.new as { data: AppData }).data;
        if (newData) onUpdate(newData);
      }
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
