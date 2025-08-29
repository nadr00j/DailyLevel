-- TESTAR DADOS NO SUPABASE

-- 1. VERIFICAR DADOS DE GAMIFICAÇÃO
SELECT 'USER_GAMIFICATION' as tabela, COUNT(*) as total_registros FROM user_gamification;
SELECT 'USER_SETTINGS' as tabela, COUNT(*) as total_registros FROM user_settings;

-- 2. VERIFICAR DADOS DE TAREFAS
SELECT 'TASKS' as tabela, COUNT(*) as total_registros FROM tasks;

-- 3. VERIFICAR DADOS DE HÁBITOS
SELECT 'HABITS' as tabela, COUNT(*) as total_registros FROM habits;
SELECT 'HABIT_COMPLETIONS' as tabela, COUNT(*) as total_registros FROM habit_completions;

-- 4. VERIFICAR DADOS DE METAS
SELECT 'GOALS' as tabela, COUNT(*) as total_registros FROM goals;
SELECT 'MILESTONES' as tabela, COUNT(*) as total_registros FROM milestones;

-- 5. VERIFICAR DADOS DA LOJA
SELECT 'SHOP_ITEMS' as tabela, COUNT(*) as total_registros FROM shop_items;

-- 6. VERIFICAR HISTÓRICO DE GAMIFICAÇÃO
SELECT 'GAMIFICATION_HISTORY' as tabela, COUNT(*) as total_registros FROM gamification_history;

-- 7. VERIFICAR DADOS ESPECÍFICOS DO USUÁRIO
SELECT 'USER_GAMIFICATION' as tabela, user_id, xp, coins, vitality, mood 
FROM user_gamification 
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47';

SELECT 'USER_SETTINGS' as tabela, user_id, confetti_enabled 
FROM user_settings 
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47';

SELECT 'TASKS' as tabela, user_id, title, completed 
FROM tasks 
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47'
LIMIT 5;

SELECT 'HABITS' as tabela, user_id, title, frequency, streak 
FROM habits 
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47'
LIMIT 5;

SELECT 'GOALS' as tabela, user_id, title, progress 
FROM goals 
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47'
LIMIT 5;
