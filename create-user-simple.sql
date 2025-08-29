-- Script SIMPLES para criar usuário Nadr00J
-- Execute este código no SQL Editor do Supabase

-- Deletar usuário existente se houver
DELETE FROM auth.users 
WHERE raw_user_meta_data->>'username' = 'Nadr00J';

-- Criar usuário Nadr00J com campos mínimos necessários
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'nadr00j@dailylevel.local',
  crypt('Mortadela1', gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"username": "Nadr00J"}',
  NOW(),
  NOW()
);

-- Verificar se foi criado
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'username' as username
FROM auth.users 
WHERE raw_user_meta_data->>'username' = 'Nadr00J';
