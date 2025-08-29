-- VERIFICAR CONFIGURAÇÕES DO SUPABASE

-- 1. VERIFICAR SE AS TABELAS EXISTEM E SUAS ESTRUTURAS
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('user_gamification', 'user_settings')
ORDER BY table_name, ordinal_position;

-- 2. VERIFICAR CONSTRAINTS E ÍNDICES
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name IN ('user_gamification', 'user_settings')
ORDER BY tc.table_name, tc.constraint_type;

-- 3. VERIFICAR SE EXISTEM TRIGGERS
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_schema = 'public'
AND event_object_table IN ('user_gamification', 'user_settings');

-- 4. VERIFICAR PERMISSÕES DA TABELA
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_gamification', 'user_settings');

-- 5. VERIFICAR SE O RLS ESTÁ REALMENTE DESABILITADO
SELECT 
    schemaname, 
    tablename, 
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('user_gamification', 'user_settings');