-- Testar operações CRUD para verificar se RLS está funcionando
-- Execute este script para testar se consegue inserir/dados

-- 1. Testar inserção de tarefa
INSERT INTO tasks (id, user_id, title, description, category, priority, status, due_date, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'f2e29d54-3de1-449b-9146-5c007a1ec439',
  'Teste de Tarefa',
  'Tarefa criada para testar RLS',
  'Estudo',
  'medium',
  'pending',
  NOW() + INTERVAL '1 day',
  NOW(),
  NOW()
);

-- 2. Testar inserção de hábito
INSERT INTO habits (id, user_id, title, description, category, frequency, streak, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'f2e29d54-3de1-449b-9146-5c007a1ec439',
  'Teste de Hábito',
  'Hábito criado para testar RLS',
  'Fitness',
  'daily',
  0,
  NOW(),
  NOW()
);

-- 3. Testar inserção de meta
INSERT INTO goals (id, user_id, title, description, category, target_value, current_value, target_date, status, created_at, updated_at)
VALUES (
  gen_random_uuid(),
  'f2e29d54-3de1-449b-9146-5c007a1ec439',
  'Teste de Meta',
  'Meta criada para testar RLS',
  'Estudo',
  100,
  0,
  NOW() + INTERVAL '30 days',
  'active',
  NOW(),
  NOW()
);

-- 4. Verificar se os dados foram inseridos
SELECT 'TASKS' as tabela, COUNT(*) as total, 
       (SELECT COUNT(*) FROM tasks WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439') as do_usuario
FROM tasks;

SELECT 'HABITS' as tabela, COUNT(*) as total,
       (SELECT COUNT(*) FROM habits WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439') as do_usuario
FROM habits;

SELECT 'GOALS' as tabela, COUNT(*) as total,
       (SELECT COUNT(*) FROM goals WHERE user_id = 'f2e29d54-3de1-449b-9146-5c007a1ec439') as do_usuario
FROM goals;
