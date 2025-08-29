-- Desabilitar RLS temporariamente na tabela profiles para debug
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Verificar se funcionou
SELECT id, username, email 
FROM profiles 
WHERE id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';

-- Reabilitar RLS com política correta
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Criar política que permite acesso ao próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Criar política que permite inserção de novos perfis
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Criar política que permite atualização do próprio perfil
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Testar a consulta novamente
SELECT id, username, email 
FROM profiles 
WHERE id = 'f2e29d54-3de1-449b-9146-5c007a1ec439';
