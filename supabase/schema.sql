-- ============================================================
-- TotalControlRH — Supabase Schema
-- Pegar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

-- 1. Tabla principal — un registro JSONB por usuario
CREATE TABLE IF NOT EXISTS public.app_data (
  user_id   uuid        PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  data      jsonb       NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Índice para ordenar por última actualización (útil para auditoría futura)
CREATE INDEX IF NOT EXISTS app_data_updated_at_idx ON public.app_data (updated_at DESC);

-- 3. Row Level Security — cada usuario solo ve y modifica sus propios datos
ALTER TABLE public.app_data ENABLE ROW LEVEL SECURITY;

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

-- 4. Habilitar Realtime para sincronización entre dispositivos
-- (también activar en: Supabase Dashboard → Database → Replication → app_data)
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_data;

-- ============================================================
-- NOTAS DE CONFIGURACIÓN:
--
-- A) En Supabase Dashboard → Authentication → Providers:
--    - Email: activado, "Confirm email" DESACTIVADO (app interna)
--
-- B) En Supabase Dashboard → Authentication → URL Configuration:
--    - Site URL: http://localhost:5173 (dev) o tu dominio de producción
--
-- C) Variables de entorno (.env):
--    VITE_SUPABASE_URL=https://xxxx.supabase.co
--    VITE_SUPABASE_ANON_KEY=eyJ...
-- ============================================================
