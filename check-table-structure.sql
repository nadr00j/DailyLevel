-- Verificar estrutura das tabelas para entender os nomes das colunas

-- 1. Verificar estrutura da tabela profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- 2. Verificar estrutura da tabela tasks
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- 3. Verificar estrutura da tabela habits
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'habits' 
ORDER BY ordinal_position;

-- 4. Verificar estrutura da tabela goals
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'goals' 
ORDER BY ordinal_position;

-- 5. Verificar estrutura da tabela user_gamification
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_gamification' 
ORDER BY ordinal_position;
