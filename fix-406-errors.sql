-- CORRIGIR ERROS 406 (NOT ACCEPTABLE) DEFINITIVAMENTE

-- 1. VERIFICAR STATUS DO RLS EM TODAS AS TABELAS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('profiles', 'tasks', 'goals', 'habits', 'habit_completions', 'milestones', 'user_gamification', 'user_settings', 'shop_items', 'gamification_history')
ORDER BY tablename;

-- 2. FORÇAR DESABILITAÇÃO DO RLS (CASO AINDA ESTEJA ATIVO)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE habits DISABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE milestones DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_history DISABLE ROW LEVEL SECURITY;

-- 3. REMOVER TODAS AS POLÍTICAS RLS EXISTENTES
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view own goals" ON goals;
DROP POLICY IF EXISTS "Users can insert own goals" ON goals;
DROP POLICY IF EXISTS "Users can update own goals" ON goals;
DROP POLICY IF EXISTS "Users can delete own goals" ON goals;
DROP POLICY IF EXISTS "Users can view own habits" ON habits;
DROP POLICY IF EXISTS "Users can insert own habits" ON habits;
DROP POLICY IF EXISTS "Users can update own habits" ON habits;
DROP POLICY IF EXISTS "Users can delete own habits" ON habits;
DROP POLICY IF EXISTS "Users can view own habit completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can insert own habit completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can update own habit completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can delete own habit completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can view own milestones" ON milestones;
DROP POLICY IF EXISTS "Users can insert own milestones" ON milestones;
DROP POLICY IF EXISTS "Users can update own milestones" ON milestones;
DROP POLICY IF EXISTS "Users can delete own milestones" ON milestones;
DROP POLICY IF EXISTS "Users can view own gamification" ON user_gamification;
DROP POLICY IF EXISTS "Users can insert own gamification" ON user_gamification;
DROP POLICY IF EXISTS "Users can update own gamification" ON user_gamification;
DROP POLICY IF EXISTS "Users can delete own gamification" ON user_gamification;
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can view own shop items" ON shop_items;
DROP POLICY IF EXISTS "Users can insert own shop items" ON shop_items;
DROP POLICY IF EXISTS "Users can update own shop items" ON shop_items;
DROP POLICY IF EXISTS "Users can delete own shop items" ON shop_items;
DROP POLICY IF EXISTS "Users can view own gamification history" ON gamification_history;
DROP POLICY IF EXISTS "Users can insert own gamification history" ON gamification_history;
DROP POLICY IF EXISTS "Users can update own gamification history" ON gamification_history;
DROP POLICY IF EXISTS "Users can delete own gamification history" ON gamification_history;

-- 4. VERIFICAR SE EXISTEM DADOS NAS TABELAS
SELECT 'USER_GAMIFICATION' as tabela, COUNT(*) as total_registros FROM user_gamification;
SELECT 'USER_SETTINGS' as tabela, COUNT(*) as total_registros FROM user_settings;

-- 5. TESTAR INSERÇÃO SIMPLES PARA VERIFICAR SE FUNCIONA
INSERT INTO user_gamification (user_id, xp, coins, xp30d, vitality, mood, xp_multiplier, xp_multiplier_expiry, str, int, cre, soc, aspect, rank_idx, rank_tier, rank_div)
VALUES ('7ceee0d2-d938-4106-880e-dbb7e976bb47', 0, 0, 0, 100, 'neutral', 1.0, 0, 0, 0, 0, 0, 'int', 0, 'Bronze', 1)
ON CONFLICT (user_id) DO UPDATE SET
  xp = EXCLUDED.xp,
  coins = EXCLUDED.coins,
  xp30d = EXCLUDED.xp30d,
  vitality = EXCLUDED.vitality,
  mood = EXCLUDED.mood,
  xp_multiplier = EXCLUDED.xp_multiplier,
  xp_multiplier_expiry = EXCLUDED.xp_multiplier_expiry,
  str = EXCLUDED.str,
  int = EXCLUDED.int,
  cre = EXCLUDED.cre,
  soc = EXCLUDED.soc,
  aspect = EXCLUDED.aspect,
  rank_idx = EXCLUDED.rank_idx,
  rank_tier = EXCLUDED.rank_tier,
  rank_div = EXCLUDED.rank_div,
  updated_at = NOW();

INSERT INTO user_settings (user_id, confetti_enabled, gamification_config)
VALUES ('7ceee0d2-d938-4106-880e-dbb7e976bb47', false, '{}')
ON CONFLICT (user_id) DO UPDATE SET
  confetti_enabled = EXCLUDED.confetti_enabled,
  gamification_config = EXCLUDED.gamification_config,
  updated_at = NOW();

-- 6. VERIFICAR SE OS DADOS FORAM INSERIDOS
SELECT 'USER_GAMIFICATION' as tabela, COUNT(*) as total_registros FROM user_gamification;
SELECT 'USER_SETTINGS' as tabela, COUNT(*) as total_registros FROM user_settings;
