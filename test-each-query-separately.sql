-- Testar cada consulta separadamente para identificar onde está falhando

-- Teste 1: PROFILES
SELECT 'PROFILES' as tabela, COUNT(*) as total_registros
FROM profiles 
WHERE id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';
