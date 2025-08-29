-- Reparação agressiva do schema para corrigir "Database error querying schema"
-- ATENÇÃO: Este script pode afetar dados existentes

-- 1. Desabilitar RLS em todas as tabelas
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS habits DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS habit_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS milestones DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_gamification DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gamification_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shop_items DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "tasks_own" ON tasks;
DROP POLICY IF EXISTS "habits_own" ON habits;
DROP POLICY IF EXISTS "goals_own" ON goals;
DROP POLICY IF EXISTS "habit_completions_own" ON habit_completions;
DROP POLICY IF EXISTS "milestones_own" ON milestones;
DROP POLICY IF EXISTS "user_gamification_own" ON user_gamification;
DROP POLICY IF EXISTS "user_settings_own" ON user_settings;
DROP POLICY IF EXISTS "gamification_history_own" ON gamification_history;
DROP POLICY IF EXISTS "shop_items_own" ON shop_items;

-- 3. Remover triggers problemáticos
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_updated_at ON profiles;
DROP TRIGGER IF EXISTS handle_updated_at ON tasks;
DROP TRIGGER IF EXISTS handle_updated_at ON habits;
DROP TRIGGER IF EXISTS handle_updated_at ON goals;

-- 4. Remover funções problemáticas
DROP FUNCTION IF EXISTS handle_updated_at();
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 5. Recriar a tabela profiles com estrutura limpa
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Recriar a função de updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Recriar trigger para updated_at
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- 8. Recriar a função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, display_name, email)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
        NEW.email
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Recriar trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 10. Inserir o perfil do usuário Nadr00J manualmente
INSERT INTO profiles (id, username, display_name, email)
VALUES (
    'f2e29d54-3de1-449b-9146-5c007a1ec439',
    'Nadr00J',
    'Nadr00J',
    'companyjfb@gmail.com'
) ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email;

-- 11. Verificar se o perfil foi criado
SELECT * FROM profiles WHERE id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 12. Testar se auth.uid() funciona
SELECT auth.uid() as current_user_id;

-- 13. Verificar se a tabela profiles está acessível
SELECT COUNT(*) as total_profiles FROM profiles;
