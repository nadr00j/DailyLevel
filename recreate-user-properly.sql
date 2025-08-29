-- Script para recriar usuário corretamente
-- Execute este código no SQL Editor do Supabase

-- 1. Deletar usuário existente
DELETE FROM auth.users 
WHERE raw_user_meta_data->>'username' = 'Nadr00J';

-- 2. Deletar perfil existente
DELETE FROM profiles 
WHERE username = 'Nadr00J';

-- 3. Verificar se foi deletado
SELECT COUNT(*) as users_deleted FROM auth.users 
WHERE raw_user_meta_data->>'username' = 'Nadr00J';

SELECT COUNT(*) as profiles_deleted FROM profiles 
WHERE username = 'Nadr00J';
