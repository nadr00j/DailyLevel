-- SCRIPT SIMPLES E DIRETO PARA CORRIGIR COLUNAS FALTANTES
-- Execute cada bloco separadamente se necessário

-- 1. ADICIONAR COLUNAS NA TABELA TASKS
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS week_start DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS week_end DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS overdue BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 2. ADICIONAR COLUNAS NA TABELA GOALS
ALTER TABLE goals ADD COLUMN IF NOT EXISTS icon_type TEXT DEFAULT 'target';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS icon_value TEXT DEFAULT 'target';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS target_value INTEGER DEFAULT 100;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS current_value INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'unidades';
ALTER TABLE goals ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS is_future BOOLEAN DEFAULT false;

-- 3. ADICIONAR COLUNAS NA TABELA USER_GAMIFICATION
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS mood TEXT DEFAULT 'neutral';
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS xp_multiplier DECIMAL(3,2) DEFAULT 1.0;
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS xp_multiplier_expiry BIGINT DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS rank_idx INTEGER DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS rank_tier TEXT DEFAULT 'Bronze';
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS rank_div INTEGER DEFAULT 1;
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS aspect TEXT DEFAULT 'int';
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS cre INTEGER DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS soc INTEGER DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS str INTEGER DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS int INTEGER DEFAULT 0;

-- 4. CRIAR TABELA HABITS SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS habits (
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

-- 5. CRIAR TABELA HABIT_COMPLETIONS SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS habit_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(habit_id, completion_date)
);

-- 6. CRIAR TABELA MILESTONES SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    value INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CRIAR TABELA GAMIFICATION_HISTORY SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS gamification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('task', 'habit', 'milestone', 'goal')),
    xp INTEGER DEFAULT 0,
    coins INTEGER DEFAULT 0,
    tags TEXT[],
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. CRIAR TABELA SHOP_ITEMS SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS shop_items (
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

-- 9. CRIAR TABELA USER_SETTINGS SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    confetti_enabled BOOLEAN DEFAULT false,
    gamification_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 10. VERIFICAR ESTRUTURA FINAL
SELECT 'TASKS' as tabela, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'tasks'
UNION ALL
SELECT 'GOALS' as tabela, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'goals'
UNION ALL
SELECT 'USER_GAMIFICATION' as tabela, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_gamification'
ORDER BY tabela, column_name;
