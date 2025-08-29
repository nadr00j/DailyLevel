-- Script para testar se o login funcionará
-- Execute este código no SQL Editor do Supabase

-- 1. Verificar se o usuário existe e está correto
SELECT 
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  raw_user_meta_data->>'username' as username
FROM auth.users 
WHERE raw_user_meta_data->>'username' = 'Nadr00J';

-- 2. Verificar se o perfil existe
SELECT 
  id,
  username,
  display_name
FROM profiles 
WHERE username = 'Nadr00J';

-- 3. Testar se a senha está correta (deve retornar true)
SELECT 
  id,
  email,
  encrypted_password = crypt('Mortadela1', encrypted_password) as password_match
FROM auth.users 
WHERE raw_user_meta_data->>'username' = 'Nadr00J';

-- 4. Verificar se RLS está desabilitado na tabela profiles
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';
