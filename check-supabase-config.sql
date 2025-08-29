-- Script para verificar configurações do Supabase
-- Execute este código no SQL Editor do Supabase

-- 1. Verificar configurações de autenticação
SELECT 
  key,
  value
FROM auth.config 
WHERE key IN ('SITE_URL', 'DISABLE_SIGNUP', 'JWT_SECRET');

-- 2. Verificar se há problemas com JWT
SELECT 
  key,
  value
FROM auth.config 
WHERE key LIKE '%JWT%';

-- 3. Verificar configurações de email
SELECT 
  key,
  value
FROM auth.config 
WHERE key LIKE '%EMAIL%';

-- 4. Verificar se há problemas com o schema
SELECT 
  nspname,
  nspowner,
  nspacl
FROM pg_namespace 
WHERE nspname = 'auth';

-- 5. Verificar se há problemas com funções
SELECT 
  proname,
  proargtypes,
  prorettype,
  prosrc
FROM pg_proc 
WHERE proname LIKE '%auth%' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'auth');
