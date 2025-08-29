-- Verificar se há dados em TODAS as tabelas (sem filtro de usuário)
-- Para entender se o problema é RLS ou se as tabelas estão realmente vazias

-- 1. PROFILES - total geral
SELECT 'PROFILES' as tabela, COUNT(*) as total_registros
FROM profiles;

-- 2. TASKS - total geral
SELECT 'TASKS' as tabela, COUNT(*) as total_registros
FROM tasks;

-- 3. HABITS - total geral
SELECT 'HABITS' as tabela, COUNT(*) as total_registros
FROM habits;

-- 4. GOALS - total geral
SELECT 'GOALS' as tabela, COUNT(*) as total_registros
FROM goals;

-- 5. USER_GAMIFICATION - total geral
SELECT 'USER_GAMIFICATION' as tabela, COUNT(*) as total_registros
FROM user_gamification;

-- 6. USER_SETTINGS - total geral
SELECT 'USER_SETTINGS' as tabela, COUNT(*) as total_registros
FROM user_settings;

-- 7. SHOP_ITEMS - total geral
SELECT 'SHOP_ITEMS' as tabela, COUNT(*) as total_registros
FROM shop_items;

-- 8. GAMIFICATION_HISTORY - total geral
SELECT 'GAMIFICATION_HISTORY' as tabela, COUNT(*) as total_registros
FROM gamification_history;

-- 9. HABIT_COMPLETIONS - total geral
SELECT 'HABIT_COMPLETIONS' as tabela, COUNT(*) as total_registros
FROM habit_completions;

-- 10. MILESTONES - total geral
SELECT 'MILESTONES' as tabela, COUNT(*) as total_registros
FROM milestones;
