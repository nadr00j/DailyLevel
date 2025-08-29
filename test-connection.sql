-- Script para testar a conexão e dados
-- Execute este código no SQL Editor do Supabase

-- 1. Testar se conseguimos acessar a tabela profiles
SELECT COUNT(*) as total_profiles FROM profiles;

-- 2. Testar se conseguimos acessar os usuários
SELECT COUNT(*) as total_users FROM auth.users;

-- 3. Verificar se o usuário Nadr00J existe
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'username' as username,
  u.created_at
FROM auth.users u
WHERE u.raw_user_meta_data->>'username' = 'Nadr00J';

-- 4. Verificar se o perfil Nadr00J existe
SELECT 
  p.id,
  p.username,
  p.display_name,
  p.created_at
FROM profiles p
WHERE p.username = 'Nadr00J';

-- 5. Testar join entre auth.users e profiles
SELECT 
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->>'username' as auth_username,
  p.username as profile_username,
  p.display_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.raw_user_meta_data->>'username' = 'Nadr00J';
