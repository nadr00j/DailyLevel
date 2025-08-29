-- Script para verificar problemas no schema
-- Execute este código no SQL Editor do Supabase

-- 1. Verificar se há problemas com a tabela auth.users
SELECT COUNT(*) as total_users FROM auth.users;

-- 2. Verificar se o usuário Nadr00J existe e está correto
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'username' as username
FROM auth.users 
WHERE raw_user_meta_data->>'username' = 'Nadr00J';

-- 3. Verificar se há problemas com a tabela profiles
SELECT COUNT(*) as total_profiles FROM profiles;

-- 4. Verificar se há políticas RLS problemáticas
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'auth.users');

-- 5. Verificar se RLS está habilitado em tabelas críticas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('profiles', 'auth.users');
