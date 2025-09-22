-- Verificar os últimos itens de histórico salvos
SELECT 
    id,
    user_id,
    ts,
    type,
    xp,
    coins,
    category,
    tags,
    created_at
FROM history_items 
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47'
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar se há algum erro na tabela
SELECT COUNT(*) as total_items FROM history_items WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47';
