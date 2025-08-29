-- Verificar dados em todas as tabelas principais (CORRIGIDO)
-- Substitua 'f2e29d54-3de1-449b-9146-5c007a1ec439' pelo seu id se necessário

-- 1. Verificar perfil do usuário (usa 'id')
SELECT 'PROFILES' as tabela, COUNT(*) as total_registros
FROM profiles 
WHERE id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 2. Verificar tarefas (usa 'id')
SELECT 'TASKS' as tabela, COUNT(*) as total_registros
FROM tasks 
WHERE id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 3. Verificar hábitos (usa 'id')
SELECT 'HABITS' as tabela, COUNT(*) as total_registros
FROM habits 
WHERE id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 4. Verificar metas (usa 'id')
SELECT 'GOALS' as tabela, COUNT(*) as total_registros
FROM goals 
WHERE id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 5. Verificar gamificação (usa 'id')
SELECT 'USER_GAMIFICATION' as tabela, COUNT(*) as total_registros
FROM user_gamification 
WHERE id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 6. Verificar configurações (usa 'id')
SELECT 'USER_SETTINGS' as tabela, COUNT(*) as total_registros
FROM user_settings 
WHERE id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 7. Verificar itens da loja (usa 'id')
SELECT 'SHOP_ITEMS' as tabela, COUNT(*) as total_registros
FROM shop_items 
WHERE id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 8. Verificar histórico de gamificação (usa 'id')
SELECT 'GAMIFICATION_HISTORY' as tabela, COUNT(*) as total_registros
FROM gamification_history 
WHERE id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 9. Verificar completions de hábitos (usa 'id')
SELECT 'HABIT_COMPLETIONS' as tabela, COUNT(*) as total_registros
FROM habit_completions 
WHERE id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 10. Verificar marcos (usa 'id')
SELECT 'MILESTONES' as tabela, COUNT(*) as total_registros
FROM milestones 
WHERE id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';
