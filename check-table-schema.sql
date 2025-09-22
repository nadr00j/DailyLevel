-- Verificar se a tabela history_items existe e sua estrutura
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'history_items' 
ORDER BY ordinal_position;

-- Verificar se há dados na tabela
SELECT COUNT(*) as total_records FROM history_items;

-- Verificar se há dados para o usuário específico
SELECT COUNT(*) as user_records FROM history_items WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47';
