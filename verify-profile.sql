-- Script para verificar se o perfil foi criado
-- Execute este código no SQL Editor do Supabase

-- 1. Verificar se o perfil existe
SELECT 
  id,
  username,
  display_name,
  created_at
FROM profiles 
WHERE username = 'Nadr00J';

-- 2. Verificar se RLS está desabilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- 3. Testar acesso direto à tabela profiles
SELECT COUNT(*) as total_profiles FROM profiles;

-- 4. Verificar se conseguimos fazer select com filtro
SELECT * FROM profiles WHERE username = 'Nadr00J';
