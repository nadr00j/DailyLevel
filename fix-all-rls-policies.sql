-- Corrigir políticas RLS para todas as tabelas principais
-- Execute este script se as tabelas estiverem vazias devido a problemas de RLS

-- 1. PROFILES (já corrigido, mas vamos garantir)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. TASKS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own tasks" ON tasks;
CREATE POLICY "Users can manage own tasks" ON tasks
    FOR ALL USING (auth.uid() = user_id);

-- 3. HABITS
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own habits" ON habits;
CREATE POLICY "Users can manage own habits" ON habits
    FOR ALL USING (auth.uid() = user_id);

-- 4. GOALS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own goals" ON goals;
CREATE POLICY "Users can manage own goals" ON goals
    FOR ALL USING (auth.uid() = user_id);

-- 5. USER_GAMIFICATION
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own gamification" ON user_gamification;
CREATE POLICY "Users can manage own gamification" ON user_gamification
    FOR ALL USING (auth.uid() = user_id);

-- 6. USER_SETTINGS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own settings" ON user_settings;
CREATE POLICY "Users can manage own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- 7. SHOP_ITEMS
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own shop items" ON shop_items;
CREATE POLICY "Users can manage own shop items" ON shop_items
    FOR ALL USING (auth.uid() = user_id);

-- 8. GAMIFICATION_HISTORY
ALTER TABLE gamification_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own gamification history" ON gamification_history;
CREATE POLICY "Users can manage own gamification history" ON gamification_history
    FOR ALL USING (auth.uid() = user_id);

-- 9. HABIT_COMPLETIONS
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own habit completions" ON habit_completions;
CREATE POLICY "Users can manage own habit completions" ON habit_completions
    FOR ALL USING (auth.uid() = user_id);

-- 10. MILESTONES
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own milestones" ON milestones;
CREATE POLICY "Users can manage own milestones" ON milestones
    FOR ALL USING (auth.uid() = user_id);

-- Verificar se as políticas foram criadas corretamente
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename IN (
  'profiles', 'tasks', 'habits', 'goals', 'user_gamification', 
  'user_settings', 'shop_items', 'gamification_history', 
  'habit_completions', 'milestones'
)
ORDER BY tablename, policyname;
