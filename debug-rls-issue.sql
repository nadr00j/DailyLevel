-- Verificar se o usuário existe na tabela profiles
SELECT id, username, email, created_at 
FROM profiles 
WHERE id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- Verificar políticas RLS na tabela profiles
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- Verificar se RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles';
