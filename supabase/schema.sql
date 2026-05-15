-- ============================================================
-- TotalControlRH — Supabase Schema (idempotente, se puede re-ejecutar)
-- Pegar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. Tabla principal — un registro JSONB por usuario
CREATE TABLE IF NOT EXISTS public.app_data (
  user_id    uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  data       jsonb       NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Índice para ordenar por última actualización
CREATE INDEX IF NOT EXISTS app_data_updated_at_idx ON public.app_data (updated_at DESC);

-- 3. Row Level Security
ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;

-- Drop antes de crear (idempotente)
DROP POLICY IF EXISTS "Usuario puede leer sus datos"      ON public.app_data;
DROP POLICY IF EXISTS "Usuario puede insertar sus datos"  ON public.app_data;
DROP POLICY IF EXISTS "Usuario puede actualizar sus datos" ON public.app_data;

CREATE POLICY "Usuario puede leer sus datos"
  ON public.app_data FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuario puede insertar sus datos"
  ON public.app_data FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuario puede actualizar sus datos"
  ON public.app_data FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_data;

-- ============================================================
-- NOTAS DE CONFIGURACIÓN:
--
-- A) Authentication → Providers → Email:
--    "Confirm email" DESACTIVADO (app interna)
--
-- B) Authentication → URL Configuration:
--    Site URL: http://localhost:5173 (dev)
--
-- C) Variables de entorno (.env):
--    VITE_SUPABASE_URL=https://xxxx.supabase.co
--    VITE_SUPABASE_ANON_KEY=eyJ...
-- ============================================================
