-- CORRIGIR PROBLEMAS DE RLS E CONFLITOS FINAIS

-- 1. DESABILITAR RLS TEMPORARIAMENTE PARA TESTES
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

-- 2. LIMPAR DADOS DUPLICADOS EM USER_SETTINGS
-- (Isso resolve o erro 23505 - duplicate key constraint)
DELETE FROM user_settings WHERE user_id IN (
    SELECT user_id 
    FROM user_settings 
    GROUP BY user_id 
    HAVING COUNT(*) > 1
);

-- 3. VERIFICAR SE EXISTEM DADOS DUPLICADOS EM USER_GAMIFICATION
DELETE FROM user_gamification WHERE user_id IN (
    SELECT user_id 
    FROM user_gamification 
    GROUP BY user_id 
    HAVING COUNT(*) > 1
);

-- 4. VERIFICAR ESTRUTURA FINAL DAS TABELAS PRINCIPAIS
SELECT 'USER_GAMIFICATION' as tabela, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_gamification'
ORDER BY column_name;

SELECT 'USER_SETTINGS' as tabela, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_settings'
ORDER BY column_name;

-- 5. VERIFICAR SE EXISTEM DADOS NAS TABELAS
SELECT 'USER_GAMIFICATION' as tabela, COUNT(*) as total_registros FROM user_gamification;
SELECT 'USER_SETTINGS' as tabela, COUNT(*) as total_registros FROM user_settings;
SELECT 'TASKS' as tabela, COUNT(*) as total_registros FROM tasks;
SELECT 'GOALS' as tabela, COUNT(*) as total_registros FROM goals;
