-- Script para verificar usuário existente
-- Execute este código no SQL Editor do Supabase

-- 1. Verificar se o usuário existe e está correto
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'username' as username,
  created_at,
  updated_at
FROM auth.users 
WHERE email = 'nadr00j@dailylevel.local';

-- 2. Verificar se o perfil existe
SELECT * FROM profiles WHERE username = 'Nadr00J';

-- 3. Verificar se há problemas com a senha
SELECT 
  id,
  email,
  encrypted_password,
  email_confirmed_at
FROM auth.users 
WHERE email = 'nadr00j@dailylevel.local';

-- 4. Verificar se o usuário está ativo
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data,
  created_at
FROM auth.users 
WHERE email = 'nadr00j@dailylevel.local';
