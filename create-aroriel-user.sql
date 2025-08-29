-- Script para criar usuário Aroriel
-- Execute este código no SQL Editor do Supabase

-- 1. Criar usuário usando função admin
SELECT auth.admin_create_user(
  'aroriel@dailylevel.local',
  'senha123',
  '{"username": "Aroriel"}'::jsonb,
  true
);

-- 2. Verificar se foi criado
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data->>'username' as username
FROM auth.users 
WHERE email = 'aroriel@dailylevel.local';

-- 3. Criar perfil para Aroriel
INSERT INTO profiles (id, username, display_name, email, created_at, updated_at)
SELECT 
  id,
  'Aroriel',
  'Aroriel',
  'aroriel@dailylevel.local',
  now(),
  now()
FROM auth.users 
WHERE email = 'aroriel@dailylevel.local';

-- 4. Verificar se o perfil foi criado
SELECT * FROM profiles WHERE username = 'Aroriel';

-- 5. Criar dados iniciais de gamificação para Aroriel
INSERT INTO user_gamification (user_id, xp, coins, xp30d, vitality, mood, str, int, cre, soc, aspect, rank_idx, rank_tier, rank_div)
SELECT 
  id,
  0,
  0,
  0,
  100,
  'neutral',
  0,
  0,
  0,
  0,
  'int',
  0,
  'Bronze',
  1
FROM auth.users 
WHERE email = 'aroriel@dailylevel.local';

-- 6. Verificar dados criados
SELECT 
  p.username,
  p.email,
  ug.xp,
  ug.coins,
  ug.vitality
FROM profiles p
LEFT JOIN user_gamification ug ON p.id = ug.user_id
WHERE p.username = 'Aroriel';
