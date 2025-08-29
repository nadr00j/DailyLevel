-- Verificar políticas RLS em todas as tabelas principais

-- 1. Verificar se RLS está habilitado em todas as tabelas
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN (
  'profiles', 'tasks', 'habits', 'goals', 'user_gamification', 
  'user_settings', 'shop_items', 'gamification_history', 
  'habit_completions', 'milestones'
)
ORDER BY tablename;

-- 2. Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename IN (
  'profiles', 'tasks', 'habits', 'goals', 'user_gamification', 
  'user_settings', 'shop_items', 'gamification_history', 
  'habit_completions', 'milestones'
)
ORDER BY tablename, policyname;
