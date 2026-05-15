-- ============================================================
-- TotalControlRH - Schema v3: gestion de usuarios de la app
-- Ejecutar despues de schema-v2.sql.
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

CREATE OR REPLACE FUNCTION public.verify_app_user(
  p_username text,
  p_password_hash text
)
RETURNS TABLE(
  id uuid,
  username text,
  role text,
  display_name text,
  active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT au.id, au.username, au.role, au.display_name, au.active
  FROM public.app_users au
  WHERE au.username = trim(p_username)
    AND au.password_hash = p_password_hash
    AND au.active = true
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_app_user(text, text) TO anon, authenticated;

DROP POLICY IF EXISTS "Leer usuarios" ON public.app_users;
DROP POLICY IF EXISTS "Gestionar usuarios" ON public.app_users;
DROP POLICY IF EXISTS "Leer usuarios autenticados" ON public.app_users;
DROP POLICY IF EXISTS "Gestionar usuarios autenticados" ON public.app_users;

CREATE POLICY "Leer usuarios autenticados"
  ON public.app_users FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Gestionar usuarios autenticados"
  ON public.app_users FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================
-- Bootstrap opcional:
--
-- INSERT INTO public.app_users (username, password_hash, role, display_name)
-- VALUES (
--   'KataS',
--   '6bb81bcab8a6481a4ef420f50ee63d3d249aa0394451dd6de711f8a86498c900',
--   'admin',
--   'Katarina S.'
-- )
-- ON CONFLICT (username) DO NOTHING;
--
-- Nota de seguridad:
-- - El cliente ya no necesita leer password_hash para login remoto.
-- - verify_app_user valida dentro de Supabase y devuelve solo perfil/rol.
-- ============================================================
