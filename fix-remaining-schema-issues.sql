-- CORRIGIR PROBLEMAS RESTANTES NO SCHEMA

-- 1. REMOVER COLUNAS DUPLICADAS NA USER_GAMIFICATION
-- (Manter as versões com underscore, remover as com camelCase)
ALTER TABLE user_gamification DROP COLUMN IF EXISTS "rankDiv";
ALTER TABLE user_gamification DROP COLUMN IF EXISTS "rankIdx";
ALTER TABLE user_gamification DROP COLUMN IF EXISTS "rankTier";

-- 2. ADICIONAR COLUNA XP30D FALTANTE
ALTER TABLE user_gamification ADD COLUMN IF NOT EXISTS xp30d INTEGER DEFAULT 0;

-- 3. VERIFICAR SE TODAS AS TABELAS NECESSÁRIAS EXISTEM
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

CREATE TABLE IF NOT EXISTS habit_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(habit_id, completion_date)
);

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

CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    confetti_enabled BOOLEAN DEFAULT false,
    gamification_config JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 4. VERIFICAR ESTRUTURA FINAL LIMPA
SELECT 'USER_GAMIFICATION' as tabela, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_gamification'
ORDER BY column_name;
