-- Adicionar colunas faltantes nas tabelas
-- Resolve erros: 'overdue' column of 'tasks', 'color' column of 'goals', 'aspect' column of 'user_gamification'

-- 1. Verificar estrutura atual das tabelas
SELECT 'TASKS' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'tasks'
UNION ALL
SELECT 'GOALS' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'goals'
UNION ALL
SELECT 'USER_GAMIFICATION' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_gamification'
ORDER BY tabela, column_name;

-- 2. Adicionar colunas faltantes na tabela TASKS
DO $$
BEGIN
    -- Adicionar coluna 'overdue' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'overdue'
    ) THEN
        ALTER TABLE tasks ADD COLUMN overdue BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Coluna overdue adicionada à tabela tasks';
    ELSE
        RAISE NOTICE 'Coluna overdue já existe na tabela tasks';
    END IF;
END $$;

-- 3. Adicionar colunas faltantes na tabela GOALS
DO $$
BEGIN
    -- Adicionar coluna 'color' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'goals' AND column_name = 'color'
    ) THEN
        ALTER TABLE goals ADD COLUMN color TEXT DEFAULT '#3B82F6';
        RAISE NOTICE 'Coluna color adicionada à tabela goals';
    ELSE
        RAISE NOTICE 'Coluna color já existe na tabela goals';
    END IF;
END $$;

-- 4. Adicionar colunas faltantes na tabela USER_GAMIFICATION
DO $$
BEGIN
    -- Adicionar coluna 'aspect' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'aspect'
    ) THEN
        ALTER TABLE user_gamification ADD COLUMN aspect TEXT DEFAULT 'neutral';
        RAISE NOTICE 'Coluna aspect adicionada à tabela user_gamification';
    ELSE
        RAISE NOTICE 'Coluna aspect já existe na tabela user_gamification';
    END IF;
END $$;

-- 5. Verificar se todas as colunas foram adicionadas
SELECT 'TASKS' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'tasks'
UNION ALL
SELECT 'GOALS' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'goals'
UNION ALL
SELECT 'USER_GAMIFICATION' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_gamification'
ORDER BY tabela, column_name;

-- 6. Verificar se há dados nas tabelas
SELECT 'tasks' as tabela, COUNT(*) as total FROM tasks
UNION ALL
SELECT 'goals' as tabela, COUNT(*) as total FROM goals
UNION ALL
SELECT 'user_gamification' as tabela, COUNT(*) as total FROM user_gamification;
