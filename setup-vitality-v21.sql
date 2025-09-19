-- Setup completo do sistema de vitalidade V2.1
-- Execute este arquivo no Supabase SQL Editor

-- 1. Criar tabelas necessárias
\i create-vitality-v21-tables.sql

-- 2. Criar funções RPC
\i create-vitality-v21-functions.sql

-- 3. Verificar se as funções foram criadas
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'vitality_%';

-- 4. Testar função básica
SELECT vitality_sync_open('7ceee0d2-d938-4106-880e-dbb7e976bb47'::uuid);
