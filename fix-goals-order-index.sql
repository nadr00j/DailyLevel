-- Adicionar coluna order_index na tabela goals
-- Resolve erro: column goals.order_index does not exist

-- 1. Verificar estrutura atual da tabela goals
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'goals'
ORDER BY ordinal_position;

-- 2. Adicionar coluna order_index se não existir
DO $$
BEGIN
    -- Verificar se a coluna order_index já existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'goals' 
        AND column_name = 'order_index'
    ) THEN
        -- Adicionar a coluna order_index
        ALTER TABLE goals ADD COLUMN order_index INTEGER DEFAULT 0;
        
        -- Atualizar valores existentes com um índice sequencial
        UPDATE goals 
        SET order_index = subquery.row_number
        FROM (
            SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_number
            FROM goals
        ) subquery
        WHERE goals.id = subquery.id;
        
        RAISE NOTICE 'Coluna order_index adicionada à tabela goals';
    ELSE
        RAISE NOTICE 'Coluna order_index já existe na tabela goals';
    END IF;
END $$;

-- 3. Verificar se a coluna foi adicionada
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'goals'
ORDER BY ordinal_position;

-- 4. Verificar dados na tabela goals
SELECT id, title, order_index, created_at
FROM goals
ORDER BY order_index, created_at
LIMIT 10;
