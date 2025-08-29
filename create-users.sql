-- Script para criar usuários manualmente no Supabase
-- Execute este script no SQL Editor do Supabase

-- ===== CRIAR USUÁRIOS =====

-- 1. Criar usuário Nadr00J
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

-- 2. Criar usuário User2 (substitua pelos dados reais)
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
  'user2@dailylevel.local',
  crypt('senha123', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"username": "User2"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- 3. Criar usuário User3 (substitua pelos dados reais)
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
  'user3@dailylevel.local',
  crypt('senha123', gen_salt('bf')),
  NOW(),
  NULL,
  NULL,
  '{"provider": "email", "providers": ["email"]}',
  '{"username": "User3"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- ===== CRIAR PERFIS =====

-- Criar perfil para Nadr00J
INSERT INTO profiles (id, username, display_name, email)
SELECT 
  id,
  'Nadr00J',
  'Nadr00J',
  'nadr00j@dailylevel.local'
FROM auth.users 
WHERE raw_user_meta_data->>'username' = 'Nadr00J';

-- Criar perfil para User2
INSERT INTO profiles (id, username, display_name, email)
SELECT 
  id,
  'User2',
  'User2',
  'user2@dailylevel.local'
FROM auth.users 
WHERE raw_user_meta_data->>'username' = 'User2';

-- Criar perfil para User3
INSERT INTO profiles (id, username, display_name, email)
SELECT 
  id,
  'User3',
  'User3',
  'user3@dailylevel.local'
FROM auth.users 
WHERE raw_user_meta_data->>'username' = 'User3';

-- ===== VERIFICAR USUÁRIOS CRIADOS =====
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'username' as username,
  p.display_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.raw_user_meta_data->>'username' IN ('Nadr00J', 'User2', 'User3');
