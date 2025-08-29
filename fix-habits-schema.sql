-- CORRIGIR SCHEMA DA TABELA HABITS

-- 1. VERIFICAR ESTRUTURA ATUAL DA TABELA HABITS
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'habits'
ORDER BY ordinal_position;

-- 2. ADICIONAR COLUNAS FALTANTES NA TABELA HABITS
ALTER TABLE habits ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS icon_type TEXT DEFAULT 'emoji';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS icon_value TEXT DEFAULT '📝';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';
ALTER TABLE habits ADD COLUMN IF NOT EXISTS target_count INTEGER DEFAULT 1;
ALTER TABLE habits ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- 3. VERIFICAR ESTRUTURA APÓS CORREÇÃO
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'habits'
ORDER BY ordinal_position;

-- 4. VERIFICAR DADOS EXISTENTES
SELECT COUNT(*) as total_habits FROM habits;
