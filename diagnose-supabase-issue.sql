-- Script para diagnosticar problema do Supabase
-- Execute este código no SQL Editor do Supabase

-- 1. Verificar se há problemas com o schema auth
SELECT 
  schemaname, 
  tablename, 
  tableowner,
  hasindexes,
  hasrules,
  hastriggers
FROM pg_tables 
WHERE schemaname = 'auth';

-- 2. Verificar se há problemas com políticas RLS
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE schemaname = 'auth';

-- 3. Verificar se há problemas com permissões
SELECT 
  grantee, 
  table_name, 
  privilege_type, 
  is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'auth' 
AND table_name = 'users';

-- 4. Verificar se há problemas com extensões
SELECT 
  extname, 
  extversion, 
  extrelocatable
FROM pg_extension 
WHERE extname LIKE '%auth%' OR extname LIKE '%supabase%';

-- 5. Verificar logs de erro (se disponível)
SELECT 
  log_time, 
  log_level, 
  message, 
  detail
FROM pg_log 
WHERE message LIKE '%schema%' 
OR message LIKE '%auth%'
ORDER BY log_time DESC 
LIMIT 10;
