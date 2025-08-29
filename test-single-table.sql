-- Testar uma tabela por vez para verificar dados
-- Substitua 'TASKS' pela tabela que quiser testar

-- Testar TASKS
SELECT 'TASKS' as tabela, COUNT(*) as total_registros
FROM tasks 
WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- Se der erro, tente com 'id' em vez de 'user_id':
-- SELECT 'TASKS' as tabela, COUNT(*) as total_registros
-- FROM tasks 
-- WHERE id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';
