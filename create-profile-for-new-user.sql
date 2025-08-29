-- Script para criar perfil para o novo usuário
-- Execute este código no SQL Editor do Supabase

-- 1. Verificar se o usuário existe
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data,
  created_at
FROM auth.users 
WHERE email = 'companyjfb@gmail.com';

-- 2. Criar perfil para o usuário
INSERT INTO profiles (id, username, display_name, created_at, updated_at)
SELECT 
  id,
  'Nadr00J',
  'Nadr00J',
  now(),
  now()
FROM auth.users 
WHERE email = 'companyjfb@gmail.com';

-- 3. Verificar se o perfil foi criado
SELECT * FROM profiles WHERE username = 'Nadr00J';

-- 4. Verificar se há políticas RLS ativas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'profiles';
