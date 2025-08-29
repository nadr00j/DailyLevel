-- Script para corrigir criação do usuário
-- Execute este código no SQL Editor do Supabase

-- 1. Deletar usuário existente se houver problema
DELETE FROM auth.users 
WHERE raw_user_meta_data->>'username' = 'Nadr00J';

-- 2. Criar usuário Nadr00J corretamente
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
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
  NOW(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"username": "Nadr00J"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 3. Verificar se foi criado corretamente
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'username' as username
FROM auth.users 
WHERE raw_user_meta_data->>'username' = 'Nadr00J';
