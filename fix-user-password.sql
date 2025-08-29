-- Script para corrigir senha do usuário existente
-- Execute este código no SQL Editor do Supabase

-- 1. Atualizar a senha do usuário existente
UPDATE auth.users 
SET 
  encrypted_password = crypt('Mortadela1', gen_salt('bf')),
  updated_at = now()
WHERE email = 'nadr00j@dailylevel.local';

-- 2. Verificar se a senha foi atualizada
SELECT 
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data->>'username' as username
FROM auth.users 
WHERE email = 'nadr00j@dailylevel.local';

-- 3. Garantir que o perfil existe
INSERT INTO profiles (id, username, display_name, created_at, updated_at)
SELECT 
  id,
  'Nadr00J',
  'Nadr00J',
  now(),
  now()
FROM auth.users 
WHERE email = 'nadr00j@dailylevel.local'
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  display_name = EXCLUDED.display_name,
  updated_at = now();

-- 4. Verificar se o perfil está correto
SELECT * FROM profiles WHERE username = 'Nadr00J';
