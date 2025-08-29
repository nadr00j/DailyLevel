-- Row Level Security (RLS) Policies para DailyLevel
-- Execute estes comandos no SQL Editor do Supabase

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- ===== PROFILES =====
-- Usuários podem ver e editar apenas seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ===== USER_GAMIFICATION =====
-- Usuários podem ver e editar apenas seus próprios dados de gamificação
CREATE POLICY "Users can view own gamification data" ON user_gamification
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own gamification data" ON user_gamification
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gamification data" ON user_gamification
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===== TASKS =====
-- Usuários podem ver e editar apenas suas próprias tarefas
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks" ON tasks
  FOR DELETE USING (auth.uid() = user_id);

-- ===== HABITS =====
-- Usuários podem ver e editar apenas seus próprios hábitos
CREATE POLICY "Users can view own habits" ON habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habits" ON habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON habits
  FOR DELETE USING (auth.uid() = user_id);

-- ===== HABIT_COMPLETIONS =====
-- Usuários podem ver e editar apenas as conclusões de seus próprios hábitos
CREATE POLICY "Users can view own habit completions" ON habit_completions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM habits 
      WHERE habits.id = habit_completions.habit_id 
      AND habits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own habit completions" ON habit_completions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM habits 
      WHERE habits.id = habit_completions.habit_id 
      AND habits.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own habit completions" ON habit_completions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM habits 
      WHERE habits.id = habit_completions.habit_id 
      AND habits.user_id = auth.uid()
    )
  );

-- ===== GOALS =====
-- Usuários podem ver e editar apenas suas próprias metas
CREATE POLICY "Users can view own goals" ON goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own goals" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own goals" ON goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own goals" ON goals
  FOR DELETE USING (auth.uid() = user_id);

-- ===== MILESTONES =====
-- Usuários podem ver e editar apenas os marcos de suas próprias metas
CREATE POLICY "Users can view own milestones" ON milestones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = milestones.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own milestones" ON milestones
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = milestones.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own milestones" ON milestones
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = milestones.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own milestones" ON milestones
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM goals 
      WHERE goals.id = milestones.goal_id 
      AND goals.user_id = auth.uid()
    )
  );

-- ===== GAMIFICATION_HISTORY =====
-- Usuários podem ver apenas seu próprio histórico de gamificação
CREATE POLICY "Users can view own gamification history" ON gamification_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own gamification history" ON gamification_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===== SHOP_ITEMS =====
-- Usuários podem ver e editar apenas seus próprios itens da loja
CREATE POLICY "Users can view own shop items" ON shop_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own shop items" ON shop_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own shop items" ON shop_items
  FOR UPDATE USING (auth.uid() = user_id);

-- ===== USER_SETTINGS =====
-- Usuários podem ver e editar apenas suas próprias configurações
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ===== FUNÇÕES AUXILIARES =====
-- Função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8))
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
