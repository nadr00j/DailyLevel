-- Verificar estrutura de TODAS as tabelas para entender os nomes das colunas

-- 1. PROFILES
SELECT 'PROFILES' as tabela, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. TASKS
SELECT 'TASKS' as tabela, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- 3. HABITS
SELECT 'HABITS' as tabela, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'habits' 
ORDER BY ordinal_position;

-- 4. GOALS
SELECT 'GOALS' as tabela, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'goals' 
ORDER BY ordinal_position;

-- 5. USER_GAMIFICATION
SELECT 'USER_GAMIFICATION' as tabela, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'user_gamification' 
ORDER BY ordinal_position;

-- 6. USER_SETTINGS
SELECT 'USER_SETTINGS' as tabela, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
ORDER BY ordinal_position;

-- 7. SHOP_ITEMS
SELECT 'SHOP_ITEMS' as tabela, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'shop_items' 
ORDER BY ordinal_position;

-- 8. GAMIFICATION_HISTORY
SELECT 'GAMIFICATION_HISTORY' as tabela, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'gamification_history' 
ORDER BY ordinal_position;

-- 9. HABIT_COMPLETIONS
SELECT 'HABIT_COMPLETIONS' as tabela, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'habit_completions' 
ORDER BY ordinal_position;

-- 10. MILESTONES
SELECT 'MILESTONES' as tabela, column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'milestones' 
ORDER BY ordinal_position;
