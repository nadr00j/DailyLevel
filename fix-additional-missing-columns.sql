-- Adicionar colunas adicionais faltantes nas tabelas
-- Resolve erros: 'week_end' column of 'tasks', 'icon_type' column of 'goals', 'cre' column of 'user_gamification'

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
    -- Adicionar coluna 'week_end' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'week_end'
    ) THEN
        ALTER TABLE tasks ADD COLUMN week_end DATE;
        RAISE NOTICE 'Coluna week_end adicionada à tabela tasks';
    ELSE
        RAISE NOTICE 'Coluna week_end já existe na tabela tasks';
    END IF;
END $$;

-- 3. Adicionar colunas faltantes na tabela GOALS
DO $$
BEGIN
    -- Adicionar coluna 'icon_type' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'goals' AND column_name = 'icon_type'
    ) THEN
        ALTER TABLE goals ADD COLUMN icon_type TEXT DEFAULT 'target';
        RAISE NOTICE 'Coluna icon_type adicionada à tabela goals';
    ELSE
        RAISE NOTICE 'Coluna icon_type já existe na tabela goals';
    END IF;
END $$;

-- 4. Adicionar colunas faltantes na tabela USER_GAMIFICATION
DO $$
BEGIN
    -- Adicionar coluna 'cre' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'cre'
    ) THEN
        ALTER TABLE user_gamification ADD COLUMN cre INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna cre adicionada à tabela user_gamification';
    ELSE
        RAISE NOTICE 'Coluna cre já existe na tabela user_gamification';
    END IF;
    
    -- Adicionar coluna 'soc' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'soc'
    ) THEN
        ALTER TABLE user_gamification ADD COLUMN soc INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna soc adicionada à tabela user_gamification';
    ELSE
        RAISE NOTICE 'Coluna soc já existe na tabela user_gamification';
    END IF;
    
    -- Adicionar coluna 'str' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'str'
    ) THEN
        ALTER TABLE user_gamification ADD COLUMN str INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna str adicionada à tabela user_gamification';
    ELSE
        RAISE NOTICE 'Coluna str já existe na tabela user_gamification';
    END IF;
    
    -- Adicionar coluna 'int' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'int'
    ) THEN
        ALTER TABLE user_gamification ADD COLUMN int INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna int adicionada à tabela user_gamification';
    ELSE
        RAISE NOTICE 'Coluna int já existe na tabela user_gamification';
    END IF;
    
    -- Adicionar coluna 'rankIdx' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'rankIdx'
    ) THEN
        ALTER TABLE user_gamification ADD COLUMN "rankIdx" INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna rankIdx adicionada à tabela user_gamification';
    ELSE
        RAISE NOTICE 'Coluna rankIdx já existe na tabela user_gamification';
    END IF;
    
    -- Adicionar coluna 'rankTier' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'rankTier'
    ) THEN
        ALTER TABLE user_gamification ADD COLUMN "rankTier" TEXT DEFAULT 'Bronze';
        RAISE NOTICE 'Coluna rankTier adicionada à tabela user_gamification';
    ELSE
        RAISE NOTICE 'Coluna rankTier já existe na tabela user_gamification';
    END IF;
    
    -- Adicionar coluna 'rankDiv' se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'rankDiv'
    ) THEN
        ALTER TABLE user_gamification ADD COLUMN "rankDiv" INTEGER DEFAULT 1;
        RAISE NOTICE 'Coluna rankDiv adicionada à tabela user_gamification';
    ELSE
        RAISE NOTICE 'Coluna rankDiv já existe na tabela user_gamification';
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
