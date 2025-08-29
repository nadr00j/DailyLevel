-- Script para desabilitar RLS temporariamente para teste
-- Execute este código no SQL Editor do Supabase

-- 1. Desabilitar RLS na tabela profiles temporariamente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. Verificar se RLS foi desabilitado
SELECT 
  schemaname, 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';

-- 3. Verificar se há políticas ativas
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd, 
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. Testar acesso direto à tabela
SELECT COUNT(*) as total_profiles FROM profiles;
