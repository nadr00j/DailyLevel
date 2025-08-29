-- Script para corrigir problemas de autenticação do Supabase
-- Execute este código no SQL Editor do Supabase

-- 1. Verificar se o usuário existe
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'username' as username,
  created_at
FROM auth.users 
WHERE email = 'nadr00j@dailylevel.local';

-- 2. Se o usuário não existir, criar usando a função correta
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'nadr00j@dailylevel.local',
  crypt('Mortadela1', gen_salt('bf')),
  now(),
  '{"username": "Nadr00J"}'::jsonb,
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- 3. Verificar se foi criado
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'username' as username
FROM auth.users 
WHERE email = 'nadr00j@dailylevel.local';

-- 4. Criar perfil correspondente
INSERT INTO profiles (id, username, display_name, created_at, updated_at)
SELECT 
  id,
  'Nadr00J',
  'Nadr00J',
  now(),
  now()
FROM auth.users 
WHERE email = 'nadr00j@dailylevel.local';

-- 5. Verificar se o perfil foi criado
SELECT * FROM profiles WHERE username = 'Nadr00J';
