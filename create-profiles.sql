-- Script para criar perfis dos usuários
-- Execute APENAS este código no SQL Editor do Supabase

-- Criar perfil para Nadr00J
INSERT INTO profiles (id, username, display_name)
SELECT 
  id,
  'Nadr00J',
  'Nadr00J'
FROM auth.users 
WHERE raw_user_meta_data->>'username' = 'Nadr00J';

-- Criar perfil para User2
INSERT INTO profiles (id, username, display_name)
SELECT 
  id,
  'User2',
  'User2'
FROM auth.users 
WHERE raw_user_meta_data->>'username' = 'User2';

-- Criar perfil para User3
INSERT INTO profiles (id, username, display_name)
SELECT 
  id,
  'User3',
  'User3'
FROM auth.users 
WHERE raw_user_meta_data->>'username' = 'User3';
