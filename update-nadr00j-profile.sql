-- Atualizar o perfil do usuário Nadr00J com o ID correto da autenticação
UPDATE profiles 
SET id = 'f2e29d54-3de1-449b-9146-5c007a1ec439'
WHERE username = 'Nadr00J';

-- Verificar se a atualização foi bem-sucedida
SELECT id, username, email, created_at 
FROM profiles 
WHERE username = 'Nadr00J';
