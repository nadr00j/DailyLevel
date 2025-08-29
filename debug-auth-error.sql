-- Script para debugar erro de autenticação
-- Execute este código no SQL Editor do Supabase

-- 1. Verificar se o usuário Nadr00J foi criado corretamente
SELECT 
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at
FROM auth.users 
WHERE raw_user_meta_data->>'username' = 'Nadr00J';

-- 2. Verificar se há problemas com a senha
SELECT 
  id,
  email,
  length(encrypted_password) as password_length,
  email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users 
WHERE raw_user_meta_data->>'username' = 'Nadr00J';

-- 3. Verificar se o email está correto
SELECT 
  id,
  email,
  raw_user_meta_data->>'username' as username
FROM auth.users 
WHERE email = 'nadr00j@dailylevel.local';
