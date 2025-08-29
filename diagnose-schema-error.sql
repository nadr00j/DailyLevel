-- Diagnosticar e corrigir erro "Database error querying schema"
-- Este erro geralmente indica problemas com RLS ou schema inconsistente

-- 1. Verificar se RLS está habilitado em todas as tabelas
SELECT schemaname, tablename, rowsecurity, hasrls
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Verificar políticas existentes
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Verificar se há problemas com auth.uid()
-- Testar se a função auth.uid() está funcionando
SELECT auth.uid() as current_user_id;

-- 4. Verificar se há tabelas órfãs ou com problemas
SELECT 
    t.table_name,
    t.table_type,
    CASE WHEN p.policyname IS NULL THEN 'SEM POLÍTICA' ELSE 'COM POLÍTICA' END as policy_status
FROM information_schema.tables t
LEFT JOIN pg_policies p ON t.table_name = p.tablename
WHERE t.table_schema = 'public' 
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name;

-- 5. Verificar constraints que podem estar causando problemas
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- 6. Verificar se há problemas específicos com a tabela profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;
