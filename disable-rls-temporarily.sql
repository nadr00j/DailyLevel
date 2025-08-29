-- Desabilitar RLS temporariamente para testar se há dados

-- Desabilitar RLS em todas as tabelas
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE habits DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE milestones DISABLE ROW LEVEL SECURITY;

-- Agora testar todas as consultas
SELECT 'PROFILES' as tabela, COUNT(*) as total_registros
FROM profiles 
WHERE id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

SELECT 'TASKS' as tabela, COUNT(*) as total_registros
FROM tasks 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

SELECT 'HABITS' as tabela, COUNT(*) as total_registros
FROM habits 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

SELECT 'GOALS' as tabela, COUNT(*) as total_registros
FROM goals 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

SELECT 'USER_GAMIFICATION' as tabela, COUNT(*) as total_registros
FROM user_gamification 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

SELECT 'USER_SETTINGS' as tabela, COUNT(*) as total_registros
FROM user_settings 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

SELECT 'SHOP_ITEMS' as tabela, COUNT(*) as total_registros
FROM shop_items 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

SELECT 'GAMIFICATION_HISTORY' as tabela, COUNT(*) as total_registros
FROM gamification_history 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

SELECT 'HABIT_COMPLETIONS' as tabela, COUNT(*) as total_registros
FROM habit_completions hc
JOIN habits h ON hc.habit_id = h.id
WHERE h.user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

SELECT 'MILESTONES' as tabela, COUNT(*) as total_registros
FROM milestones m
JOIN goals g ON m.goal_id = g.id
WHERE g.user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';