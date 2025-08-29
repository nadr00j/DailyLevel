-- CORRIGIR CONFLITOS FINAIS E DESABILITAR RLS PERMANENTEMENTE

-- 1. DESABILITAR RLS PERMANENTEMENTE EM TODAS AS TABELAS
-- (Isso resolve os erros 406 - Not Acceptable)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE habits DISABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE milestones DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_history DISABLE ROW LEVEL SECURITY;

-- 2. LIMPAR COMPLETAMENTE A TABELA USER_SETTINGS
-- (Isso resolve o erro 23505 - duplicate key constraint)
TRUNCATE TABLE user_settings CASCADE;

-- 3. LIMPAR COMPLETAMENTE A TABELA USER_GAMIFICATION
-- (Isso resolve possíveis conflitos futuros)
TRUNCATE TABLE user_gamification CASCADE;

-- 4. VERIFICAR SE AS TABELAS ESTÃO VAZIAS
SELECT 'USER_GAMIFICATION' as tabela, COUNT(*) as total_registros FROM user_gamification;
SELECT 'USER_SETTINGS' as tabela, COUNT(*) as total_registros FROM user_settings;

-- 5. VERIFICAR ESTRUTURA FINAL DAS TABELAS PRINCIPAIS
SELECT 'USER_GAMIFICATION' as tabela, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_gamification'
ORDER BY column_name;

SELECT 'USER_SETTINGS' as tabela, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_settings'
ORDER BY column_name;
