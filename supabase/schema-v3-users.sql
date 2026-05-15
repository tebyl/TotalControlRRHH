-- ============================================================
-- TotalControlRH — Schema v3: Gestión de usuarios
-- Pegar en: Supabase Dashboard → SQL Editor → New query → Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_users (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  username      text        NOT NULL UNIQUE,
  password_hash text        NOT NULL,
  role          text        NOT NULL DEFAULT 'rrhh' CHECK (role IN ('admin', 'rrhh', 'lectura')),
  display_name  text        NOT NULL,
  active        boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;

-- Lectura pública con anon key (necesario para login antes de tener sesión)
DROP POLICY IF EXISTS "Leer usuarios" ON public.app_users;
CREATE POLICY "Leer usuarios"
  ON public.app_users FOR SELECT
  USING (true);

-- Solo usuarios autenticados pueden crear/editar/eliminar
DROP POLICY IF EXISTS "Gestionar usuarios" ON public.app_users;
CREATE POLICY "Gestionar usuarios"
  ON public.app_users FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- IMPORTANTE: después de ejecutar este SQL, crea el primer
-- usuario admin desde la UI (Configuración → Usuarios) o
-- inserta manualmente el hash SHA-256 de la contraseña:
--
-- INSERT INTO public.app_users (username, password_hash, role, display_name)
-- VALUES ('KataS', '6bb81bcab8a6481a4ef420f50ee63d3d249aa0394451dd6de711f8a86498c900', 'admin', 'Katarina S.');
-- ============================================================
