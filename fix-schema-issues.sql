-- Corrigir problemas de schema que podem causar "Database error querying schema"

-- 1. Desabilitar RLS temporariamente para diagnosticar
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE habits DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE milestones DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items DISABLE ROW LEVEL SECURITY;

-- 2. Remover todas as políticas existentes para limpar
DROP POLICY IF EXISTS "profiles_select_permissive" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "tasks_manage_own" ON tasks;
DROP POLICY IF EXISTS "habits_manage_own" ON habits;
DROP POLICY IF EXISTS "goals_manage_own" ON goals;
DROP POLICY IF EXISTS "habit_completions_manage_own" ON habit_completions;
DROP POLICY IF EXISTS "milestones_manage_own" ON milestones;
DROP POLICY IF EXISTS "gamification_manage_own" ON user_gamification;
DROP POLICY IF EXISTS "settings_manage_own" ON user_settings;
DROP POLICY IF EXISTS "gh_manage_own" ON gamification_history;
DROP POLICY IF EXISTS "shop_manage_own" ON shop_items;

-- 3. Verificar se as tabelas existem e têm a estrutura correta
-- Se alguma tabela não existir, vamos recriar

-- Verificar se profiles existe e tem a estrutura correta
DO $$
BEGIN
    -- Se a tabela profiles não existir, criar
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        CREATE TABLE profiles (
            id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            display_name TEXT,
            avatar_url TEXT,
            email TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

-- 4. Recriar políticas simples e funcionais
-- Habilitar RLS novamente
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas básicas e funcionais
-- Profiles: permitir SELECT público, INSERT/UPDATE restrito
CREATE POLICY "profiles_select_public" ON profiles
    FOR SELECT USING (true);

CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Outras tabelas: políticas básicas
CREATE POLICY "tasks_own" ON tasks
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "habits_own" ON habits
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "goals_own" ON goals
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "habit_completions_own" ON habit_completions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM habits h
            WHERE h.id = habit_completions.habit_id
            AND h.user_id = auth.uid()
        )
    );

CREATE POLICY "milestones_own" ON milestones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM goals g
            WHERE g.id = milestones.goal_id
            AND g.user_id = auth.uid()
        )
    );

CREATE POLICY "user_gamification_own" ON user_gamification
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_settings_own" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "gamification_history_own" ON gamification_history
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "shop_items_own" ON shop_items
    FOR ALL USING (auth.uid() = user_id);

-- 6. Verificar se tudo está funcionando
SELECT 'Schema fix completed' as status;
