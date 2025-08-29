-- Verificar dados em todas as tabelas principais (VERSÃO FINAL)
-- Baseado na estrutura real das tabelas

-- 1. Verificar perfil do usuário (usa 'id')
SELECT 'PROFILES' as tabela, COUNT(*) as total_registros
FROM profiles 
WHERE id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 2. Verificar tarefas (usa 'user_id')
SELECT 'TASKS' as tabela, COUNT(*) as total_registros
FROM tasks 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 3. Verificar hábitos (usa 'user_id')
SELECT 'HABITS' as tabela, COUNT(*) as total_registros
FROM habits 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 4. Verificar metas (usa 'user_id')
SELECT 'GOALS' as tabela, COUNT(*) as total_registros
FROM goals 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 5. Verificar gamificação (usa 'user_id')
SELECT 'USER_GAMIFICATION' as tabela, COUNT(*) as total_registros
FROM user_gamification 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 6. Verificar configurações (usa 'user_id')
SELECT 'USER_SETTINGS' as tabela, COUNT(*) as total_registros
FROM user_settings 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 7. Verificar itens da loja (usa 'user_id')
SELECT 'SHOP_ITEMS' as tabela, COUNT(*) as total_registros
FROM shop_items 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 8. Verificar histórico de gamificação (usa 'user_id')
SELECT 'GAMIFICATION_HISTORY' as tabela, COUNT(*) as total_registros
FROM gamification_history 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 9. Verificar completions de hábitos (usa 'user_id')
SELECT 'HABIT_COMPLETIONS' as tabela, COUNT(*) as total_registros
FROM habit_completions 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- 10. Verificar marcos (usa 'user_id')
SELECT 'MILESTONES' as tabela, COUNT(*) as total_registros
FROM milestones 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';
