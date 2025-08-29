-- Script para verificar a estrutura da tabela profiles
-- Execute este código no SQL Editor do Supabase

-- Verificar estrutura da tabela profiles
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;
