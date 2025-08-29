-- Script para criar usuário via Admin API
-- Execute este código no SQL Editor do Supabase

-- 1. Primeiro, deletar usuário existente se houver
DELETE FROM auth.users WHERE email = 'nadr00j@dailylevel.local';
DELETE FROM profiles WHERE username = 'Nadr00J';

-- 2. Criar usuário usando função admin
SELECT auth.admin_create_user(
  'nadr00j@dailylevel.local',
  'Mortadela1',
  '{"username": "Nadr00J"}'::jsonb,
  true
);

-- 3. Verificar se foi criado
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'username' as username
FROM auth.users 
WHERE email = 'nadr00j@dailylevel.local';

-- 4. Criar perfil
INSERT INTO profiles (id, username, display_name, created_at, updated_at)
SELECT 
  id,
  'Nadr00J',
  'Nadr00J',
  now(),
  now()
FROM auth.users 
WHERE email = 'nadr00j@dailylevel.local';

-- 5. Verificar perfil
SELECT * FROM profiles WHERE username = 'Nadr00J';
