-- Verificar dados em todas as tabelas com estrutura correta
-- Baseado na estrutura real das tabelas

-- 1. PROFILES (usa 'id')
SELECT 'PROFILES' as tabela, COUNT(*) as total_registros
FROM profiles 
WHERE id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 2. TASKS (usa 'user_id') - JÁ CONFIRMADO QUE TEM 6 REGISTROS
SELECT 'TASKS' as tabela, COUNT(*) as total_registros
FROM tasks 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 3. HABITS (usa 'user_id')
SELECT 'HABITS' as tabela, COUNT(*) as total_registros
FROM habits 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 4. GOALS (usa 'user_id')
SELECT 'GOALS' as tabela, COUNT(*) as total_registros
FROM goals 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 5. USER_GAMIFICATION (usa 'user_id')
SELECT 'USER_GAMIFICATION' as tabela, COUNT(*) as total_registros
FROM user_gamification 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 6. USER_SETTINGS (usa 'user_id')
SELECT 'USER_SETTINGS' as tabela, COUNT(*) as total_registros
FROM user_settings 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 7. SHOP_ITEMS (usa 'user_id')
SELECT 'SHOP_ITEMS' as tabela, COUNT(*) as total_registros
FROM shop_items 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 8. GAMIFICATION_HISTORY (usa 'user_id')
SELECT 'GAMIFICATION_HISTORY' as tabela, COUNT(*) as total_registros
FROM gamification_history 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 9. HABIT_COMPLETIONS (usa 'user_id')
SELECT 'HABIT_COMPLETIONS' as tabela, COUNT(*) as total_registros
FROM habit_completions 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 10. MILESTONES (usa 'goal_id' - não tem user_id direto)
SELECT 'MILESTONES' as tabela, COUNT(*) as total_registros
FROM milestones m
JOIN goals g ON m.goal_id = g.id
WHERE g.user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';
