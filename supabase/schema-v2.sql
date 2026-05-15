-- ============================================================
-- TotalControlRH — Schema v2: Workspaces colaborativos
-- Ejecutar DESPUÉS de schema.sql (o en un proyecto limpio)
-- Pegar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. Tabla de equipos/workspaces
CREATE TABLE IF NOT EXISTS public.workspaces (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL DEFAULT 'Mi equipo',
  invite_code  text        NOT NULL UNIQUE DEFAULT upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_by   uuid        NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- 2. Membresía: qué usuarios pertenecen a qué workspace
CREATE TABLE IF NOT EXISTS public.workspace_members (
  workspace_id uuid  NOT NULL REFERENCES public.workspaces (id) ON DELETE CASCADE,
  user_id      uuid  NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  role         text  NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor')),
  joined_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

-- 3. Migrar app_data: cambiar PK de user_id a workspace_id
--    Si la tabla ya existe con datos, esta migración es manual.
--    Para un proyecto limpio, recrear la tabla.
DROP TABLE IF EXISTS public.app_data;

CREATE TABLE IF NOT EXISTS public.app_data (
  workspace_id uuid        PRIMARY KEY REFERENCES public.workspaces (id) ON DELETE CASCADE,
  data         jsonb       NOT NULL DEFAULT '{}',
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- 4. Índices
CREATE INDEX IF NOT EXISTS workspace_members_user_idx ON public.workspace_members (user_id);
CREATE INDEX IF NOT EXISTS app_data_updated_at_idx    ON public.app_data (updated_at DESC);

-- 5. Row Level Security
ALTER TABLE public.workspaces         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_data           ENABLE ROW LEVEL SECURITY;

-- Workspaces: ver los tuyos
DROP POLICY IF EXISTS "Ver workspaces propios" ON public.workspaces;
CREATE POLICY "Ver workspaces propios"
  ON public.workspaces FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = id AND wm.user_id = auth.uid()
  ));

-- Workspaces: crear (cualquier usuario autenticado)
DROP POLICY IF EXISTS "Crear workspace" ON public.workspaces;
CREATE POLICY "Crear workspace"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Workspace members: ver los del workspace al que perteneces
DROP POLICY IF EXISTS "Ver miembros del workspace" ON public.workspace_members;
CREATE POLICY "Ver miembros del workspace"
  ON public.workspace_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm2
    WHERE wm2.workspace_id = workspace_id AND wm2.user_id = auth.uid()
  ));

-- Workspace members: insertar (unirse a un workspace)
DROP POLICY IF EXISTS "Unirse a workspace" ON public.workspace_members;
CREATE POLICY "Unirse a workspace"
  ON public.workspace_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- app_data: leer si eres miembro
DROP POLICY IF EXISTS "Miembros pueden leer datos" ON public.app_data;
CREATE POLICY "Miembros pueden leer datos"
  ON public.app_data FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = app_data.workspace_id AND wm.user_id = auth.uid()
  ));

-- app_data: insertar si eres miembro
DROP POLICY IF EXISTS "Miembros pueden insertar datos" ON public.app_data;
CREATE POLICY "Miembros pueden insertar datos"
  ON public.app_data FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid()
  ));

-- app_data: actualizar si eres miembro
DROP POLICY IF EXISTS "Miembros pueden actualizar datos" ON public.app_data;
CREATE POLICY "Miembros pueden actualizar datos"
  ON public.app_data FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = app_data.workspace_id AND wm.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_id AND wm.user_id = auth.uid()
  ));

-- 6. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_data;

-- ============================================================
-- NOTAS:
-- - Un usuario puede pertenecer a un solo workspace a la vez
--   (lógica enforced desde el frontend)
-- - El invite_code es de 8 chars, se comparte para invitar
-- - El dueño (owner) puede ver el código; los editores también
-- ============================================================
