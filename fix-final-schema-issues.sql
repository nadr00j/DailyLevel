-- CORRIGIR PROBLEMAS FINAIS NO SCHEMA

-- 1. VERIFICAR E CRIAR TABELA USER_SETTINGS CORRETAMENTE
DROP TABLE IF EXISTS user_settings CASCADE;

CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    confetti_enabled BOOLEAN DEFAULT false,
    gamification_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. HABILITAR RLS E CRIAR POLÍTICAS PARA TODAS AS TABELAS

-- Habilitar RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_history ENABLE ROW LEVEL SECURITY;

-- 3. CRIAR POLÍTICAS RLS PERMISSIVAS PARA TODAS AS TABELAS

-- Profiles - Permitir leitura pública para login
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Tasks
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
CREATE POLICY "Users can view own tasks" ON tasks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
CREATE POLICY "Users can insert own tasks" ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
CREATE POLICY "Users can update own tasks" ON tasks FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
CREATE POLICY "Users can delete own tasks" ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Goals
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
CREATE POLICY "Users can view own goals" ON goals FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
CREATE POLICY "Users can insert own goals" ON goals FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own goals" ON goals;
CREATE POLICY "Users can update own goals" ON goals FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own goals" ON goals;
CREATE POLICY "Users can delete own goals" ON goals FOR DELETE USING (auth.uid() = user_id);

-- Habits
DROP POLICY IF EXISTS "Users can view own habits" ON habits;
CREATE POLICY "Users can view own habits" ON habits FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own habits" ON habits;
CREATE POLICY "Users can insert own habits" ON habits FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own habits" ON habits;
CREATE POLICY "Users can update own habits" ON habits FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own habits" ON habits;
CREATE POLICY "Users can delete own habits" ON habits FOR DELETE USING (auth.uid() = user_id);

-- Habit Completions
DROP POLICY IF EXISTS "Users can view own habit completions" ON habit_completions;
CREATE POLICY "Users can view own habit completions" ON habit_completions FOR SELECT USING (
    EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_completions.habit_id AND habits.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own habit completions" ON habit_completions;
CREATE POLICY "Users can insert own habit completions" ON habit_completions FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_completions.habit_id AND habits.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own habit completions" ON habit_completions;
CREATE POLICY "Users can update own habit completions" ON habit_completions FOR UPDATE USING (
    EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_completions.habit_id AND habits.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own habit completions" ON habit_completions;
CREATE POLICY "Users can delete own habit completions" ON habit_completions FOR DELETE USING (
    EXISTS (SELECT 1 FROM habits WHERE habits.id = habit_completions.habit_id AND habits.user_id = auth.uid())
);

-- Milestones
DROP POLICY IF EXISTS "Users can view own milestones" ON milestones;
CREATE POLICY "Users can view own milestones" ON milestones FOR SELECT USING (
    EXISTS (SELECT 1 FROM goals WHERE goals.id = milestones.goal_id AND goals.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can insert own milestones" ON milestones;
CREATE POLICY "Users can insert own milestones" ON milestones FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM goals WHERE goals.id = milestones.goal_id AND goals.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can update own milestones" ON milestones;
CREATE POLICY "Users can update own milestones" ON milestones FOR UPDATE USING (
    EXISTS (SELECT 1 FROM goals WHERE goals.id = milestones.goal_id AND goals.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own milestones" ON milestones;
CREATE POLICY "Users can delete own milestones" ON milestones FOR DELETE USING (
    EXISTS (SELECT 1 FROM goals WHERE goals.id = milestones.goal_id AND goals.user_id = auth.uid())
);

-- User Gamification
DROP POLICY IF EXISTS "Users can view own gamification" ON user_gamification;
CREATE POLICY "Users can view own gamification" ON user_gamification FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own gamification" ON user_gamification;
CREATE POLICY "Users can insert own gamification" ON user_gamification FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own gamification" ON user_gamification;
CREATE POLICY "Users can update own gamification" ON user_gamification FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own gamification" ON user_gamification;
CREATE POLICY "Users can delete own gamification" ON user_gamification FOR DELETE USING (auth.uid() = user_id);

-- User Settings
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own settings" ON user_settings;
CREATE POLICY "Users can delete own settings" ON user_settings FOR DELETE USING (auth.uid() = user_id);

-- Shop Items
DROP POLICY IF EXISTS "Users can view own shop items" ON shop_items;
CREATE POLICY "Users can view own shop items" ON shop_items FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own shop items" ON shop_items;
CREATE POLICY "Users can insert own shop items" ON shop_items FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own shop items" ON shop_items;
CREATE POLICY "Users can update own shop items" ON shop_items FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own shop items" ON shop_items;
CREATE POLICY "Users can delete own shop items" ON shop_items FOR DELETE USING (auth.uid() = user_id);

-- Gamification History
DROP POLICY IF EXISTS "Users can view own gamification history" ON gamification_history;
CREATE POLICY "Users can view own gamification history" ON gamification_history FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own gamification history" ON gamification_history;
CREATE POLICY "Users can insert own gamification history" ON gamification_history FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own gamification history" ON gamification_history;
CREATE POLICY "Users can update own gamification history" ON gamification_history FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own gamification history" ON gamification_history;
CREATE POLICY "Users can delete own gamification history" ON gamification_history FOR DELETE USING (auth.uid() = user_id);

-- 4. VERIFICAR ESTRUTURA FINAL
SELECT 'USER_SETTINGS' as tabela, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_settings'
ORDER BY column_name;
