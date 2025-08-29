-- Script para criar usuário via API do Supabase
-- Execute este código no SQL Editor do Supabase

-- Criar usuário usando função do Supabase
SELECT auth.signup(
  'nadr00j@dailylevel.local',
  'Mortadela1',
  '{"username": "Nadr00J"}'::jsonb
);

-- Verificar se foi criado
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'username' as username
FROM auth.users 
WHERE email = 'nadr00j@dailylevel.local';
