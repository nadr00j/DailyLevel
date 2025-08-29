-- Script para corrigir acesso à tabela profiles
-- Execute este código no SQL Editor do Supabase

-- 1. Verificar se RLS está habilitado na tabela profiles
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- 2. Verificar políticas existentes na tabela profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 3. Temporariamente desabilitar RLS para testar (CUIDADO: apenas para teste)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 4. Verificar se a tabela profiles tem dados
SELECT * FROM profiles;

-- 5. Verificar se os usuários foram criados corretamente
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'username' as username
FROM auth.users u
WHERE u.raw_user_meta_data->>'username' = 'Nadr00J';
