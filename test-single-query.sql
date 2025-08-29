-- Testar uma consulta por vez
-- Execute apenas uma consulta por vez para identificar o problema

-- TESTE 1: PROFILES
SELECT 'PROFILES' as tabela, COUNT(*) as total_registros
FROM profiles 
WHERE id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- TESTE 2: TASKS (comente o teste 1 e descomente este)
-- SELECT 'TASKS' as tabela, COUNT(*) as total_registros
-- FROM tasks 
-- WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- TESTE 3: HABITS (comente os anteriores e descomente este)
-- SELECT 'HABITS' as tabela, COUNT(*) as total_registros
-- FROM habits 
-- WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- TESTE 4: GOALS (comente os anteriores e descomente este)
-- SELECT 'GOALS' as tabela, COUNT(*) as total_registros
-- FROM goals 
-- WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- TESTE 5: USER_GAMIFICATION (comente os anteriores e descomente este)
-- SELECT 'USER_GAMIFICATION' as tabela, COUNT(*) as total_registros
-- FROM user_gamification 
-- WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';
