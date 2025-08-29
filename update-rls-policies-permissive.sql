-- Atualizar políticas RLS para serem mais permissivas
-- Permite consultas públicas para autenticação e operações básicas

-- 1. PROFILES - Permitir consulta por username para login
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;

-- Política permissiva para SELECT (permite buscar por username)
CREATE POLICY "profiles_select_permissive" ON profiles
    FOR SELECT USING (true);

-- Política restritiva para UPDATE/INSERT (só o próprio usuário)
CREATE POLICY "profiles_update_own" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. TASKS - Manter restritivo (só próprio usuário)
DROP POLICY IF EXISTS "tasks_manage_own" ON tasks;
CREATE POLICY "tasks_manage_own" ON tasks
    FOR ALL USING (auth.uid() = user_id);

-- 3. HABITS - Manter restritivo (só próprio usuário)
DROP POLICY IF EXISTS "habits_manage_own" ON habits;
CREATE POLICY "habits_manage_own" ON habits
    FOR ALL USING (auth.uid() = user_id);

-- 4. GOALS - Manter restritivo (só próprio usuário)
DROP POLICY IF EXISTS "goals_manage_own" ON goals;
CREATE POLICY "goals_manage_own" ON goals
    FOR ALL USING (auth.uid() = user_id);

-- 5. HABIT_COMPLETIONS - Manter restritivo (via JOIN)
DROP POLICY IF EXISTS "habit_completions_manage_own" ON habit_completions;
CREATE POLICY "habit_completions_manage_own" ON habit_completions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM habits h
            WHERE h.id = habit_completions.habit_id
            AND h.user_id = auth.uid()
        )
    );

-- 6. MILESTONES - Manter restritivo (via JOIN)
DROP POLICY IF EXISTS "milestones_manage_own" ON milestones;
CREATE POLICY "milestones_manage_own" ON milestones
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM goals g
            WHERE g.id = milestones.goal_id
            AND g.user_id = auth.uid()
        )
    );

-- 7. USER_GAMIFICATION - Manter restritivo (só próprio usuário)
DROP POLICY IF EXISTS "gamification_manage_own" ON user_gamification;
CREATE POLICY "gamification_manage_own" ON user_gamification
    FOR ALL USING (auth.uid() = user_id);

-- 8. USER_SETTINGS - Manter restritivo (só próprio usuário)
DROP POLICY IF EXISTS "settings_manage_own" ON user_settings;
CREATE POLICY "settings_manage_own" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- 9. GAMIFICATION_HISTORY - Manter restritivo (só próprio usuário)
DROP POLICY IF EXISTS "gh_manage_own" ON gamification_history;
CREATE POLICY "gh_manage_own" ON gamification_history
    FOR ALL USING (auth.uid() = user_id);

-- 10. SHOP_ITEMS - Manter restritivo (só próprio usuário)
DROP POLICY IF EXISTS "shop_manage_own" ON shop_items;
CREATE POLICY "shop_manage_own" ON shop_items
    FOR ALL USING (auth.uid() = user_id);

-- Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
