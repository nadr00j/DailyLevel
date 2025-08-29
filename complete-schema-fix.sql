-- SCRIPT COMPLETO PARA CORRIGIR TODAS AS COLUNAS FALTANTES
-- Baseado na análise completa dos arquivos do app

-- 1. Verificar estrutura atual de todas as tabelas
SELECT 'ESTRUTURA ATUAL DAS TABELAS' as info;

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

-- 2. CORRIGIR TABELA TASKS - Adicionar todas as colunas faltantes
DO $$
BEGIN
    -- week_start (DATE)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'week_start'
    ) THEN
        ALTER TABLE tasks ADD COLUMN week_start DATE;
        RAISE NOTICE 'Coluna week_start adicionada à tabela tasks';
    ELSE
        RAISE NOTICE 'Coluna week_start já existe na tabela tasks';
    END IF;

    -- week_end (DATE) - já adicionada anteriormente, mas verificando
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'week_end'
    ) THEN
        ALTER TABLE tasks ADD COLUMN week_end DATE;
        RAISE NOTICE 'Coluna week_end adicionada à tabela tasks';
    ELSE
        RAISE NOTICE 'Coluna week_end já existe na tabela tasks';
    END IF;

    -- overdue (BOOLEAN) - já adicionada anteriormente, mas verificando
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'overdue'
    ) THEN
        ALTER TABLE tasks ADD COLUMN overdue BOOLEAN DEFAULT false;
        RAISE NOTICE 'Coluna overdue adicionada à tabela tasks';
    ELSE
        RAISE NOTICE 'Coluna overdue já existe na tabela tasks';
    END IF;

    -- order_index (INTEGER) - já adicionada anteriormente, mas verificando
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'order_index'
    ) THEN
        ALTER TABLE tasks ADD COLUMN order_index INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna order_index adicionada à tabela tasks';
    ELSE
        RAISE NOTICE 'Coluna order_index já existe na tabela tasks';
    END IF;
END $$;

-- 3. CORRIGIR TABELA GOALS - Adicionar todas as colunas faltantes
DO $$
BEGIN
    -- icon_type (TEXT) - já adicionada anteriormente, mas verificando
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'goals' AND column_name = 'icon_type'
    ) THEN
        ALTER TABLE goals ADD COLUMN icon_type TEXT DEFAULT 'target';
        RAISE NOTICE 'Coluna icon_type adicionada à tabela goals';
    ELSE
        RAISE NOTICE 'Coluna icon_type já existe na tabela goals';
    END IF;

    -- icon_value (TEXT) - NOVA COLUNA FALTANTE
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'goals' AND column_name = 'icon_value'
    ) THEN
        ALTER TABLE goals ADD COLUMN icon_value TEXT DEFAULT 'target';
        RAISE NOTICE 'Coluna icon_value adicionada à tabela goals';
    ELSE
        RAISE NOTICE 'Coluna icon_value já existe na tabela goals';
    END IF;

    -- color (TEXT) - já adicionada anteriormente, mas verificando
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'goals' AND column_name = 'color'
    ) THEN
        ALTER TABLE goals ADD COLUMN color TEXT DEFAULT '#3B82F6';
        RAISE NOTICE 'Coluna color adicionada à tabela goals';
    ELSE
        RAISE NOTICE 'Coluna color já existe na tabela goals';
    END IF;

    -- order_index (INTEGER) - já adicionada anteriormente, mas verificando
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'goals' AND column_name = 'order_index'
    ) THEN
        ALTER TABLE goals ADD COLUMN order_index INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna order_index adicionada à tabela goals';
    ELSE
        RAISE NOTICE 'Coluna order_index já existe na tabela goals';
    END IF;

    -- target_value (INTEGER) - NOVA COLUNA FALTANTE
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'goals' AND column_name = 'target_value'
    ) THEN
        ALTER TABLE goals ADD COLUMN target_value INTEGER DEFAULT 100;
        RAISE NOTICE 'Coluna target_value adicionada à tabela goals';
    ELSE
        RAISE NOTICE 'Coluna target_value já existe na tabela goals';
    END IF;

    -- current_value (INTEGER) - NOVA COLUNA FALTANTE
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'goals' AND column_name = 'current_value'
    ) THEN
        ALTER TABLE goals ADD COLUMN current_value INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna current_value adicionada à tabela goals';
    ELSE
        RAISE NOTICE 'Coluna current_value já existe na tabela goals';
    END IF;

    -- unit (TEXT) - NOVA COLUNA FALTANTE
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'goals' AND column_name = 'unit'
    ) THEN
        ALTER TABLE goals ADD COLUMN unit TEXT DEFAULT 'unidades';
        RAISE NOTICE 'Coluna unit adicionada à tabela goals';
    ELSE
        RAISE NOTICE 'Coluna unit já existe na tabela goals';
    END IF;

    -- deadline (DATE) - NOVA COLUNA FALTANTE
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'goals' AND column_name = 'deadline'
    ) THEN
        ALTER TABLE goals ADD COLUMN deadline DATE;
        RAISE NOTICE 'Coluna deadline adicionada à tabela goals';
    ELSE
        RAISE NOTICE 'Coluna deadline já existe na tabela goals';
    END IF;

    -- is_completed (BOOLEAN) - NOVA COLUNA FALTANTE
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'goals' AND column_name = 'is_completed'
    ) THEN
        ALTER TABLE goals ADD COLUMN is_completed BOOLEAN DEFAULT false;
        RAISE NOTICE 'Coluna is_completed adicionada à tabela goals';
    ELSE
        RAISE NOTICE 'Coluna is_completed já existe na tabela goals';
    END IF;

    -- is_future (BOOLEAN) - NOVA COLUNA FALTANTE
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'goals' AND column_name = 'is_future'
    ) THEN
        ALTER TABLE goals ADD COLUMN is_future BOOLEAN DEFAULT false;
        RAISE NOTICE 'Coluna is_future adicionada à tabela goals';
    ELSE
        RAISE NOTICE 'Coluna is_future já existe na tabela goals';
    END IF;
END $$;

-- 4. CORRIGIR TABELA USER_GAMIFICATION - Adicionar todas as colunas faltantes
DO $$
BEGIN
    -- mood (TEXT) - NOVA COLUNA FALTANTE
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'mood'
    ) THEN
        ALTER TABLE user_gamification ADD COLUMN mood TEXT DEFAULT 'neutral';
        RAISE NOTICE 'Coluna mood adicionada à tabela user_gamification';
    ELSE
        RAISE NOTICE 'Coluna mood já existe na tabela user_gamification';
    END IF;

    -- xp_multiplier (DECIMAL) - NOVA COLUNA FALTANTE
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'xp_multiplier'
    ) THEN
        ALTER TABLE user_gamification ADD COLUMN xp_multiplier DECIMAL(3,2) DEFAULT 1.0;
        RAISE NOTICE 'Coluna xp_multiplier adicionada à tabela user_gamification';
    ELSE
        RAISE NOTICE 'Coluna xp_multiplier já existe na tabela user_gamification';
    END IF;

    -- xp_multiplier_expiry (BIGINT) - NOVA COLUNA FALTANTE
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'xp_multiplier_expiry'
    ) THEN
        ALTER TABLE user_gamification ADD COLUMN xp_multiplier_expiry BIGINT DEFAULT 0;
        RAISE NOTICE 'Coluna xp_multiplier_expiry adicionada à tabela user_gamification';
    ELSE
        RAISE NOTICE 'Coluna xp_multiplier_expiry já existe na tabela user_gamification';
    END IF;

    -- rank_idx (INTEGER) - já adicionada anteriormente, mas verificando
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'rank_idx'
    ) THEN
        ALTER TABLE user_gamification ADD COLUMN rank_idx INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna rank_idx adicionada à tabela user_gamification';
    ELSE
        RAISE NOTICE 'Coluna rank_idx já existe na tabela user_gamification';
    END IF;

    -- rank_tier (TEXT) - já adicionada anteriormente, mas verificando
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'rank_tier'
    ) THEN
        ALTER TABLE user_gamification ADD COLUMN rank_tier TEXT DEFAULT 'Bronze';
        RAISE NOTICE 'Coluna rank_tier adicionada à tabela user_gamification';
    ELSE
        RAISE NOTICE 'Coluna rank_tier já existe na tabela user_gamification';
    END IF;

    -- rank_div (INTEGER) - já adicionada anteriormente, mas verificando
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'rank_div'
    ) THEN
        ALTER TABLE user_gamification ADD COLUMN rank_div INTEGER DEFAULT 1;
        RAISE NOTICE 'Coluna rank_div adicionada à tabela user_gamification';
    ELSE
        RAISE NOTICE 'Coluna rank_div já existe na tabela user_gamification';
    END IF;

    -- aspect (TEXT) - já adicionada anteriormente, mas verificando
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'aspect'
    ) THEN
        ALTER TABLE user_gamification ADD COLUMN aspect TEXT DEFAULT 'int';
        RAISE NOTICE 'Coluna aspect adicionada à tabela user_gamification';
    ELSE
        RAISE NOTICE 'Coluna aspect já existe na tabela user_gamification';
    END IF;

    -- cre (INTEGER) - já adicionada anteriormente, mas verificando
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'cre'
    ) THEN
        ALTER TABLE user_gamification ADD COLUMN cre INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna cre adicionada à tabela user_gamification';
    ELSE
        RAISE NOTICE 'Coluna cre já existe na tabela user_gamification';
    END IF;

    -- soc (INTEGER) - já adicionada anteriormente, mas verificando
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'soc'
    ) THEN
        ALTER TABLE user_gamification ADD COLUMN soc INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna soc adicionada à tabela user_gamification';
    ELSE
        RAISE NOTICE 'Coluna soc já existe na tabela user_gamification';
    END IF;

    -- str (INTEGER) - já adicionada anteriormente, mas verificando
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'str'
    ) THEN
        ALTER TABLE user_gamification ADD COLUMN str INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna str adicionada à tabela user_gamification';
    ELSE
        RAISE NOTICE 'Coluna str já existe na tabela user_gamification';
    END IF;

    -- int (INTEGER) - já adicionada anteriormente, mas verificando
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'user_gamification' AND column_name = 'int'
    ) THEN
        ALTER TABLE user_gamification ADD COLUMN int INTEGER DEFAULT 0;
        RAISE NOTICE 'Coluna int adicionada à tabela user_gamification';
    ELSE
        RAISE NOTICE 'Coluna int já existe na tabela user_gamification';
    END IF;
END $$;

-- 5. VERIFICAR SE TODAS AS TABELAS NECESSÁRIAS EXISTEM
DO $$
BEGIN
    -- Verificar se tabela HABITS existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'habits') THEN
        CREATE TABLE habits (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            description TEXT,
            color TEXT DEFAULT '#3B82F6',
            frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly')),
            target_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],
            streak INTEGER DEFAULT 0,
            longest_streak INTEGER DEFAULT 0,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabela habits criada';
    ELSE
        RAISE NOTICE 'Tabela habits já existe';
    END IF;

    -- Verificar se tabela HABIT_COMPLETIONS existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'habit_completions') THEN
        CREATE TABLE habit_completions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
            completion_date DATE NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(habit_id, completion_date)
        );
        RAISE NOTICE 'Tabela habit_completions criada';
    ELSE
        RAISE NOTICE 'Tabela habit_completions já existe';
    END IF;

    -- Verificar se tabela MILESTONES existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'milestones') THEN
        CREATE TABLE milestones (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            value INTEGER DEFAULT 0,
            completed BOOLEAN DEFAULT false,
            completed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabela milestones criada';
    ELSE
        RAISE NOTICE 'Tabela milestones já existe';
    END IF;

    -- Verificar se tabela GAMIFICATION_HISTORY existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gamification_history') THEN
        CREATE TABLE gamification_history (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            type TEXT NOT NULL CHECK (type IN ('task', 'habit', 'milestone', 'goal')),
            xp INTEGER DEFAULT 0,
            coins INTEGER DEFAULT 0,
            tags TEXT[],
            category TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabela gamification_history criada';
    ELSE
        RAISE NOTICE 'Tabela gamification_history já existe';
    END IF;

    -- Verificar se tabela SHOP_ITEMS existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'shop_items') THEN
        CREATE TABLE shop_items (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            price INTEGER NOT NULL,
            category TEXT NOT NULL CHECK (category IN ('boost', 'cosmetic', 'utility')),
            icon TEXT,
            purchased BOOLEAN DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Tabela shop_items criada';
    ELSE
        RAISE NOTICE 'Tabela shop_items já existe';
    END IF;

    -- Verificar se tabela USER_SETTINGS existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_settings') THEN
        CREATE TABLE user_settings (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            confetti_enabled BOOLEAN DEFAULT false,
            gamification_config JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
        );
        RAISE NOTICE 'Tabela user_settings criada';
    ELSE
        RAISE NOTICE 'Tabela user_settings já existe';
    END IF;
END $$;

-- 6. Verificar estrutura final de todas as tabelas
SELECT 'ESTRUTURA FINAL DAS TABELAS' as info;

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
UNION ALL
SELECT 'HABITS' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'habits'
UNION ALL
SELECT 'HABIT_COMPLETIONS' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'habit_completions'
UNION ALL
SELECT 'MILESTONES' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'milestones'
UNION ALL
SELECT 'GAMIFICATION_HISTORY' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'gamification_history'
UNION ALL
SELECT 'SHOP_ITEMS' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'shop_items'
UNION ALL
SELECT 'USER_SETTINGS' as tabela, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_settings'
ORDER BY tabela, column_name;

-- 7. Verificar contagem de dados em todas as tabelas
SELECT 'CONTAGEM DE DADOS' as info;

SELECT 'profiles' as tabela, COUNT(*) as total FROM profiles
UNION ALL
SELECT 'tasks' as tabela, COUNT(*) as total FROM tasks
UNION ALL
SELECT 'goals' as tabela, COUNT(*) as total FROM goals
UNION ALL
SELECT 'habits' as tabela, COUNT(*) as total FROM habits
UNION ALL
SELECT 'user_gamification' as tabela, COUNT(*) as total FROM user_gamification
UNION ALL
SELECT 'user_settings' as tabela, COUNT(*) as total FROM user_settings
UNION ALL
SELECT 'shop_items' as tabela, COUNT(*) as total FROM shop_items
UNION ALL
SELECT 'habit_completions' as tabela, COUNT(*) as total FROM habit_completions
UNION ALL
SELECT 'milestones' as tabela, COUNT(*) as total FROM milestones
UNION ALL
SELECT 'gamification_history' as tabela, COUNT(*) as total FROM gamification_history;
