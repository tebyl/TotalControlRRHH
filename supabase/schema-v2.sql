-- ============================================================
-- TotalControlRH - Schema v2: workspaces colaborativos
-- Ejecutar en Supabase SQL Editor.
--
-- Seguro para proyecto nuevo. Si existe una app_data legacy con user_id,
-- este script se detiene para evitar perdida accidental de datos.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'app_data'
      AND column_name = 'user_id'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'app_data'
      AND column_name = 'workspace_id'
  ) THEN
    RAISE EXCEPTION 'app_data legacy usa user_id. Migra los datos manualmente antes de ejecutar schema-v2.sql.';
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.workspaces (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL DEFAULT 'Mi equipo',
  invite_code  text        NOT NULL UNIQUE DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_by   uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
  workspace_id uuid        NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  user_id      uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role         text        NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor')),
  display_name text        NOT NULL DEFAULT 'Usuario',
  joined_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.app_data (
  workspace_id uuid        PRIMARY KEY REFERENCES public.workspaces (id) ON DELETE CASCADE,
  data         jsonb       NOT NULL DEFAULT '{}',
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workspace_members_user_idx ON public.workspace_members (user_id);
CREATE INDEX IF NOT EXISTS app_data_updated_at_idx ON public.app_data (updated_at DESC);

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members wm
    WHERE wm.workspace_id = p_workspace_id
      AND wm.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.join_workspace_by_invite(
  p_invite_code text,
  p_display_name text DEFAULT 'Usuario'
)
RETURNS TABLE(id uuid, name text, invite_code text, created_by uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  RETURN QUERY
  WITH target_workspace AS (
    SELECT w.id, w.name, w.invite_code, w.created_by
    FROM public.workspaces w
    WHERE w.invite_code = upper(trim(p_invite_code))
    LIMIT 1
  ),
  membership AS (
    INSERT INTO public.workspace_members (workspace_id, user_id, role, display_name)
    SELECT tw.id, auth.uid(), 'editor', coalesce(nullif(trim(p_display_name), ''), 'Usuario')
    FROM target_workspace tw
    ON CONFLICT (workspace_id, user_id)
    DO UPDATE SET display_name = EXCLUDED.display_name
    RETURNING workspace_id
  )
  SELECT tw.id, tw.name, tw.invite_code, tw.created_by
  FROM target_workspace tw
  JOIN membership m ON m.workspace_id = tw.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_workspace_by_invite(text, text) TO authenticated;

DROP POLICY IF EXISTS "Ver workspaces propios" ON public.workspaces;
CREATE POLICY "Ver workspaces propios"
  ON public.workspaces FOR SELECT
  USING (created_by = auth.uid() OR public.is_workspace_member(id));

DROP POLICY IF EXISTS "Crear workspace" ON public.workspaces;
CREATE POLICY "Crear workspace"
  ON public.workspaces FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Actualizar workspace owner" ON public.workspaces;
CREATE POLICY "Actualizar workspace owner"
  ON public.workspaces FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Ver miembros del workspace" ON public.workspace_members;
CREATE POLICY "Ver miembros del workspace"
  ON public.workspace_members FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Unirse a workspace" ON public.workspace_members;
CREATE POLICY "Unirse a workspace"
  ON public.workspace_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Actualizar membresia propia" ON public.workspace_members;
CREATE POLICY "Actualizar membresia propia"
  ON public.workspace_members FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Miembros pueden leer datos" ON public.app_data;
CREATE POLICY "Miembros pueden leer datos"
  ON public.app_data FOR SELECT
  USING (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Miembros pueden insertar datos" ON public.app_data;
CREATE POLICY "Miembros pueden insertar datos"
  ON public.app_data FOR INSERT
  WITH CHECK (public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "Miembros pueden actualizar datos" ON public.app_data;
CREATE POLICY "Miembros pueden actualizar datos"
  ON public.app_data FOR UPDATE
  USING (public.is_workspace_member(workspace_id))
  WITH CHECK (public.is_workspace_member(workspace_id));

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.app_data;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- ============================================================
-- Notas:
-- - La union por codigo usa public.join_workspace_by_invite().
-- - Los workspaces solo son visibles para su creador o miembros.
-- - Si venias desde schema.sql legacy, migra app_data.user_id a workspace_id
--   antes de aplicar este script.
-- ============================================================
