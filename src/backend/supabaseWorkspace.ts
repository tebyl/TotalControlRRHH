import { supabase, SUPABASE_CONFIGURED } from "./supabaseClient";

export type Workspace = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string;
};

export type WorkspaceMember = {
  user_id: string;
  display_name: string;
  role: "owner" | "editor";
  joined_at: string;
};

export type WorkspaceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

// In-memory cache — reset on sign-out
let cachedWorkspaceId: string | null = null;

export function clearWorkspaceCache(): void {
  cachedWorkspaceId = null;
}

async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

async function getUserId(): Promise<string | null> {
  return (await getSession())?.user?.id ?? null;
}

function getDisplayName(session: Awaited<ReturnType<typeof getSession>>): string {
  return session?.user?.user_metadata?.username
    ?? session?.user?.email?.split("@")[0]
    ?? "Usuario";
}

// Get the workspace the current user belongs to
export async function getUserWorkspace(): Promise<WorkspaceResult<Workspace | null>> {
  if (!SUPABASE_CONFIGURED) return { ok: true, data: null };

  const userId = await getUserId();
  if (!userId) return { ok: true, data: null };

  if (cachedWorkspaceId) {
    const { data, error } = await supabase
      .from("workspaces")
      .select("id, name, invite_code, created_by")
      .eq("id", cachedWorkspaceId)
      .maybeSingle();
    if (!error && data) return { ok: true, data: data as Workspace };
    cachedWorkspaceId = null;
  }

  const { data, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, workspaces(id, name, invite_code, created_by)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: true, data: null };

  const raw = (data as unknown as { workspaces: Workspace | Workspace[] }).workspaces;
  const ws = Array.isArray(raw) ? raw[0] : raw;
  if (!ws) return { ok: true, data: null };
  cachedWorkspaceId = ws.id;
  return { ok: true, data: ws };
}

// Get all members of the current workspace
export async function getWorkspaceMembers(): Promise<WorkspaceResult<WorkspaceMember[]>> {
  if (!SUPABASE_CONFIGURED) return { ok: true, data: [] };

  const wsId = cachedWorkspaceId;
  if (!wsId) return { ok: true, data: [] };

  const { data, error } = await supabase
    .from("workspace_members")
    .select("user_id, display_name, role, joined_at")
    .eq("workspace_id", wsId)
    .order("joined_at", { ascending: true });

  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as WorkspaceMember[] };
}

// Create a new workspace and add the current user as owner
export async function createWorkspace(name: string): Promise<WorkspaceResult<Workspace>> {
  if (!SUPABASE_CONFIGURED) return { ok: false, error: "Supabase no configurado" };

  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Sin sesión activa" };

  const { data: ws, error: wsError } = await supabase
    .from("workspaces")
    .insert({ name, created_by: userId })
    .select("id, name, invite_code, created_by")
    .single();

  if (wsError || !ws) return { ok: false, error: wsError?.message ?? "Error creando workspace" };

  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({ workspace_id: ws.id, user_id: userId, role: "owner", display_name: getDisplayName(session) });

  if (memberError) return { ok: false, error: memberError.message };

  cachedWorkspaceId = (ws as Workspace).id;
  return { ok: true, data: ws as Workspace };
}

// Join an existing workspace by invite code
export async function joinWorkspace(inviteCode: string): Promise<WorkspaceResult<Workspace>> {
  if (!SUPABASE_CONFIGURED) return { ok: false, error: "Supabase no configurado" };

  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "Sin sesión activa" };

  const { data: ws, error: findError } = await supabase
    .from("workspaces")
    .select("id, name, invite_code, created_by")
    .eq("invite_code", inviteCode.trim().toUpperCase())
    .maybeSingle();

  if (findError) return { ok: false, error: findError.message };
  if (!ws) return { ok: false, error: "Código de invitación no encontrado" };

  const { error: memberError } = await supabase
    .from("workspace_members")
    .upsert(
      { workspace_id: ws.id, user_id: userId, role: "editor", display_name: getDisplayName(session) },
      { onConflict: "workspace_id,user_id" }
    );

  if (memberError) return { ok: false, error: memberError.message };

  cachedWorkspaceId = (ws as Workspace).id;
  return { ok: true, data: ws as Workspace };
}

export function getCachedWorkspaceId(): string | null {
  return cachedWorkspaceId;
}

export function setCachedWorkspaceId(id: string): void {
  cachedWorkspaceId = id;
}
