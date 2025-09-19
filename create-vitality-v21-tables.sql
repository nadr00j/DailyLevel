-- DailyLevel Vitality V2.1 - Tabelas e Funções
-- Sistema de vitalidade event-driven com fechamento diário automático

-- Estado agregado do usuário
CREATE TABLE IF NOT EXISTS user_vitality_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  value NUMERIC(5,2) NOT NULL DEFAULT 50,         -- 0..100
  version BIGINT NOT NULL DEFAULT 0,
  last_close_date DATE NOT NULL DEFAULT (CURRENT_DATE - INTERVAL '1 day')::DATE,
  prev_mood TEXT,                                 -- 'tired'|'sad'|'neutral'|'happy'|'confident'
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Hábitos (usando tabela existente habits)
-- A tabela habits já existe com estrutura:
-- id, user_id, title, description, color, icon_type, icon_value, categories, 
-- frequency, target_days, target_count, order_index, streak, longest_streak, 
-- is_active, created_at, updated_at, archived_at

-- Conclusões (usando tabela existente habit_completions)
-- A tabela habit_completions já existe com estrutura:
-- habit_id UUID, completion_date DATE

-- Ledger de faltas de hábito (idempotência)
CREATE TABLE IF NOT EXISTS habit_miss_ledger (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  penalty_applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, habit_id, date)
);

-- Tarefas (usando tabela existente tasks)
-- A tabela tasks já existe com estrutura completa

-- Ledger de atraso de tarefa (idempotência diária)
CREATE TABLE IF NOT EXISTS task_overdue_ledger (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  date DATE NOT NULL,                             -- dia em que estava atrasada
  penalty_applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, task_id, date)
);

-- Log de eventos (debug/replay)
CREATE TABLE IF NOT EXISTS vitality_event_log (
  event_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                             -- HABIT_DONE|TASK_DONE|GOAL_DONE|XP_GAIN|COIN_GAIN|DAY_CLOSE
  payload JSONB,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices úteis
CREATE INDEX IF NOT EXISTS idx_habits_user_active ON habits (user_id) WHERE is_active=true;
CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON tasks (user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date ON habit_completions (habit_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_vitality_event_log_user ON vitality_event_log (user_id, applied_at);

-- Função helper para verificar se um hábito é devido em uma data específica
-- Baseada na estrutura existente da tabela habits
CREATE OR REPLACE FUNCTION is_habit_due(frequency TEXT, target_days INTEGER[], check_date DATE)
RETURNS BOOLEAN AS $$
BEGIN
  -- Hábito diário
  IF frequency = 'daily' THEN
    RETURN TRUE;
  END IF;
  
  -- Hábito semanal - verificar se o dia da semana está em target_days
  IF frequency = 'weekly' AND target_days IS NOT NULL THEN
    -- target_days: 0=domingo, 1=segunda, ..., 6=sábado
    RETURN EXTRACT(DOW FROM check_date) = ANY(target_days);
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
