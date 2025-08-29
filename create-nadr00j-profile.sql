-- Script para criar perfil do Nadr00J
-- Execute este código no SQL Editor do Supabase

-- Criar perfil para Nadr00J usando o ID do usuário
INSERT INTO profiles (id, username, display_name)
VALUES (
  'c7620efd-2aa1-4498-8a9b-14c60940889e',
  'Nadr00J',
  'Nadr00J'
);

-- Verificar se o perfil foi criado
SELECT 
  p.id,
  p.username,
  p.display_name,
  p.created_at
FROM profiles p
WHERE p.username = 'Nadr00J';

-- Verificar join entre usuário e perfil
SELECT 
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->>'username' as auth_username,
  p.username as profile_username,
  p.display_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.raw_user_meta_data->>'username' = 'Nadr00J';
