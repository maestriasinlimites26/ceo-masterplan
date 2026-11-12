-- =========================================================
-- ESQUEMA COMPLETO DE BASE DE DATOS PARA CEO MASTERPLAN V1.0
-- Ejecutar este script en el SQL Editor de Supabase
-- =========================================================

-- 1. Tabla de configuraciones anuales (Metas, hábitos, tareas y preguntas)
CREATE TABLE IF NOT EXISTS public.user_configs (
    id TEXT PRIMARY KEY, -- formato: {user_id}_year_{year}
    user_id TEXT NOT NULL,
    year INT NOT NULL,
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de checks y excepciones diarias del tracker táctico
CREATE TABLE IF NOT EXISTS public.user_checks (
    id TEXT PRIMARY KEY, -- formato: {user_id}_year_{year}
    user_id TEXT NOT NULL,
    year INT NOT NULL,
    checks JSONB NOT NULL DEFAULT '{}'::jsonb,
    exceptions JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabla de fotos de perfil, visión y objetivos
CREATE TABLE IF NOT EXISTS public.user_images (
    user_id TEXT PRIMARY KEY,
    profile_pic TEXT DEFAULT '',
    images JSONB DEFAULT '[]'::jsonb,
    goal_images JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabla de usuarios autorizados (Red Élite / Whitelist)
CREATE TABLE IF NOT EXISTS public.allowed_users (
    email TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'guest',
    expires_at BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabla de sesiones y auditoría de accesos
CREATE TABLE IF NOT EXISTS public.user_sessions (
    user_id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'guest',
    last_login BIGINT,
    is_logged_in BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- SEGURIDAD: ROW LEVEL SECURITY (RLS)
-- =========================================================
ALTER TABLE public.user_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowed_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso completo para la aplicación web
DROP POLICY IF EXISTS "Allow all for user_configs" ON public.user_configs;
CREATE POLICY "Allow all for user_configs" ON public.user_configs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for user_checks" ON public.user_checks;
CREATE POLICY "Allow all for user_checks" ON public.user_checks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for user_images" ON public.user_images;
CREATE POLICY "Allow all for user_images" ON public.user_images FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for allowed_users" ON public.allowed_users;
CREATE POLICY "Allow all for allowed_users" ON public.allowed_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for user_sessions" ON public.user_sessions;
CREATE POLICY "Allow all for user_sessions" ON public.user_sessions FOR ALL USING (true) WITH CHECK (true);

-- Insertar administradores iniciales en whitelist
INSERT INTO public.allowed_users (email, name, role)
VALUES 
    ('maestriasinlimites16@gmail.com', 'CEO Clive', 'admin'),
    ('cliverdair25@gmail.com', 'CEO Clive', 'admin'),
    ('cliverdair@gmail.com', 'CEO Clive', 'admin')
ON CONFLICT (email) DO NOTHING;
