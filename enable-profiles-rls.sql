-- Script para habilitar RLS na tabela profiles com políticas corretas
-- Execute este código no SQL Editor do Supabase

-- 1. Habilitar RLS na tabela profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Criar política para permitir leitura de perfis (temporária para teste)
CREATE POLICY "Allow read access to profiles" ON profiles
  FOR SELECT USING (true);

-- 3. Criar política para permitir inserção de perfis
CREATE POLICY "Allow insert access to profiles" ON profiles
  FOR INSERT WITH CHECK (true);

-- 4. Criar política para permitir atualização de perfis
CREATE POLICY "Allow update access to profiles" ON profiles
  FOR UPDATE USING (true);

-- 5. Verificar se as políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'profiles';
