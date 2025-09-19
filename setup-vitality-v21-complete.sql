-- DailyLevel Vitality V2.1 - Setup Completo
-- Execute este script no Supabase SQL Editor para configurar o sistema completo

-- ========================================
-- 1. TABELAS
-- ========================================

-- Estado agregado do usuário
CREATE TABLE IF NOT EXISTS user_vitality_state (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  value NUMERIC(5,2) NOT NULL DEFAULT 50,         -- 0..100
  version BIGINT NOT NULL DEFAULT 0,
  last_close_date DATE NOT NULL DEFAULT (CURRENT_DATE - INTERVAL '1 day')::DATE,
  prev_mood TEXT,                                 -- 'tired'|'sad'|'neutral'|'happy'|'confident'
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ledger de faltas de hábito (idempotência)
CREATE TABLE IF NOT EXISTS habit_miss_ledger (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  penalty_applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, habit_id, date)
);

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

-- ========================================
-- 2. FUNÇÕES HELPER
-- ========================================

-- Função helper para verificar se um hábito é devido em uma data específica
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

-- ========================================
-- 3. FUNÇÕES RPC PRINCIPAIS
-- ========================================

-- RPC para fechar um dia específico para um usuário
CREATE OR REPLACE FUNCTION vitality_close_day(p_user UUID, p_date DATE)
RETURNS TABLE (new_value NUMERIC, new_version BIGINT) 
LANGUAGE plpgsql AS $$
DECLARE
  v_state user_vitality_state;
  v_prev NUMERIC;
  v_penalty_total NUMERIC := 0;
  v_penalty_cap CONSTANT NUMERIC := 20;
  v_lambda CONSTANT NUMERIC := 6.0;
  v_topfrag NUMERIC := 0;
  habit_row RECORD;
  t RECORD;
  scarcity NUMERIC;
  p_miss NUMERIC;
BEGIN
  -- Buscar ou criar estado do usuário
  SELECT * INTO v_state FROM user_vitality_state WHERE user_id = p_user FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO user_vitality_state(user_id, value, version, last_close_date)
    VALUES (p_user, 50, 0, (CURRENT_DATE - INTERVAL '1 day')::DATE)
    RETURNING * INTO v_state;
  END IF;

  -- 1) HÁBITOS devidos em p_date (is_active=true, criado <= p_date, frequency marca p_date)
  FOR habit_row IN
    SELECT h.id, h.frequency, h.target_days
    FROM habits h
    WHERE h.user_id = p_user 
      AND h.is_active = true 
      AND h.created_at::date <= p_date
      AND is_habit_due(h.frequency, h.target_days, p_date)
  LOOP
    -- Verificar se já foi concluído ou se já foi penalizado
    IF NOT EXISTS (
      SELECT 1 FROM habit_completions c 
      WHERE c.habit_id = habit_row.id 
        AND c.completion_date = p_date
    ) AND NOT EXISTS (
      SELECT 1 FROM habit_miss_ledger m 
      WHERE m.user_id = p_user 
        AND m.habit_id = habit_row.id 
        AND m.date = p_date
    ) THEN
      -- Calcular escassez (hábitos pouco frequentes doem mais)
      scarcity := CASE
        WHEN habit_row.frequency = 'daily' THEN 1.0
        WHEN habit_row.frequency = 'weekly' THEN 2.0
        ELSE 1.2
      END;
      
      p_miss := 4 * scarcity;

      -- Registrar penalidade no ledger (idempotente)
      INSERT INTO habit_miss_ledger(user_id, habit_id, date) 
      VALUES (p_user, habit_row.id, p_date)
      ON CONFLICT DO NOTHING;

      v_penalty_total := v_penalty_total + p_miss;
    END IF;
  END LOOP;

  -- 2) TAREFAS atrasadas em p_date
  FOR t IN
    SELECT id FROM tasks
    WHERE user_id = p_user 
      AND due_date <= p_date 
      AND (completed_date IS NULL OR completed_date > p_date)
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM task_overdue_ledger l 
      WHERE l.user_id = p_user 
        AND l.task_id = t.id 
        AND l.date = p_date
    ) THEN
      INSERT INTO task_overdue_ledger(user_id, task_id, date) 
      VALUES (p_user, t.id, p_date)
      ON CONFLICT DO NOTHING;
      v_penalty_total := v_penalty_total + 2;
    END IF;
  END LOOP;

  -- 3) Cap diário de penalidade
  IF v_penalty_total > v_penalty_cap THEN
    v_penalty_total := v_penalty_cap;
  END IF;

  v_prev := v_state.value;

  -- 4) Fragilidade no topo (se aplicável)
  IF v_prev >= 90 THEN
    v_topfrag := v_lambda * ((v_prev - 90) / 10) * 1.0;
  END IF;

  -- 5) Aplicar mudanças
  v_state.value := GREATEST(0, LEAST(100, v_prev - v_penalty_total - v_topfrag));
  v_state.version := v_state.version + 1;
  
  UPDATE user_vitality_state
    SET value = v_state.value, 
        version = v_state.version, 
        last_close_date = p_date, 
        updated_at = NOW()
    WHERE user_id = p_user;

  RETURN QUERY SELECT v_state.value, v_state.version;
END;
$$;

-- RPC para fechar múltiplos dias pendentes
CREATE OR REPLACE FUNCTION vitality_close_days_until(p_user UUID, p_until DATE)
RETURNS TABLE (new_value NUMERIC, new_version BIGINT) 
LANGUAGE plpgsql AS $$
DECLARE
  d DATE;
  st user_vitality_state;
BEGIN
  -- Buscar ou criar estado do usuário
  SELECT * INTO st FROM user_vitality_state WHERE user_id = p_user FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO user_vitality_state(user_id) VALUES (p_user);
    SELECT * INTO st FROM user_vitality_state WHERE user_id = p_user FOR UPDATE;
  END IF;

  -- Fechar dias pendentes um por um
  d := st.last_close_date + INTERVAL '1 day';
  WHILE d <= p_until LOOP
    PERFORM vitality_close_day(p_user, d);
    d := d + INTERVAL '1 day';
  END LOOP;

  RETURN QUERY SELECT value, version FROM user_vitality_state WHERE user_id = p_user;
END;
$$;

-- RPC para aplicar evento de gamificação
CREATE OR REPLACE FUNCTION vitality_apply_event(
  p_user UUID,
  p_event_id UUID,
  p_type TEXT,        -- HABIT_DONE|TASK_DONE|GOAL_DONE|XP_GAIN|COIN_GAIN
  p_payload JSONB,
  p_expected_version BIGINT
)
RETURNS TABLE (new_value NUMERIC, new_version BIGINT) 
LANGUAGE plpgsql AS $$
DECLARE
  st user_vitality_state;
  today DATE := (CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo')::DATE;
  gains NUMERIC := 0;
  daily_gain_cap CONSTANT NUMERIC := 10;
BEGIN
  -- Verificar idempotência do evento
  IF EXISTS (SELECT 1 FROM vitality_event_log WHERE event_id = p_event_id) THEN
    RETURN QUERY SELECT value, version FROM user_vitality_state WHERE user_id = p_user;
    RETURN;
  END IF;

  -- Fechar dias pendentes até ontem
  PERFORM vitality_close_days_until(p_user, (today - INTERVAL '1 day')::DATE);

  -- Buscar estado e verificar versão
  SELECT * INTO st FROM user_vitality_state WHERE user_id = p_user FOR UPDATE;
  IF st.version <> p_expected_version THEN
    RAISE EXCEPTION 'version_conflict';
  END IF;

  -- Aplicar ganhos simples capados
  IF p_type = 'GOAL_DONE' THEN 
    gains := gains + 2; 
  END IF;
  
  IF p_type = 'HABIT_DONE' THEN
    -- Se a conclusão é de hoje e o hábito estava devido, pequeno ganho
    gains := gains + 0.5;
  END IF;
  
  -- (XP_GAIN/COIN_GAIN podem não influenciar vitalidade diretamente)

  -- Aplicar cap de ganho diário
  gains := LEAST(gains, daily_gain_cap);

  -- Atualizar vitalidade
  st.value := GREATEST(0, LEAST(100, st.value + gains));
  st.version := st.version + 1;
  
  UPDATE user_vitality_state 
    SET value = st.value, 
        version = st.version, 
        updated_at = NOW() 
    WHERE user_id = p_user;

  -- Registrar evento
  INSERT INTO vitality_event_log(event_id, user_id, type, payload) 
  VALUES (p_event_id, p_user, p_type, p_payload);

  RETURN QUERY SELECT st.value, st.version;
END;
$$;

-- RPC para sincronizar na abertura do app
CREATE OR REPLACE FUNCTION vitality_sync_open(p_user UUID)
RETURNS TABLE (value NUMERIC, version BIGINT, last_close_date DATE) 
LANGUAGE plpgsql AS $$
DECLARE
  today DATE := (CURRENT_DATE AT TIME ZONE 'America/Sao_Paulo')::DATE;
  yesterday DATE := today - INTERVAL '1 day';
  result RECORD;
BEGIN
  -- Verificar se o usuário tem estado, se não, criar
  IF NOT EXISTS (SELECT 1 FROM user_vitality_state WHERE user_id = p_user) THEN
    INSERT INTO user_vitality_state(user_id, value, version, last_close_date)
    VALUES (p_user, 50, 0, (CURRENT_DATE - INTERVAL '1 day')::DATE);
  END IF;
  
  -- Fechar dias pendentes até ontem
  PERFORM vitality_close_days_until(p_user, yesterday);
  
  -- Retornar estado atual
  RETURN QUERY 
    SELECT vs.value, vs.version, vs.last_close_date
    FROM user_vitality_state vs
    WHERE vs.user_id = p_user;
END;
$$;

-- ========================================
-- 4. COMENTÁRIOS E INSTRUÇÕES
-- ========================================

-- Este script configura o sistema completo de Vitalidade V2.1
-- 
-- Tabelas criadas:
-- - user_vitality_state: Estado da vitalidade do usuário
-- - habit_miss_ledger: Ledger de faltas de hábito (idempotência)
-- - task_overdue_ledger: Ledger de atrasos de tarefa (idempotência)
-- - vitality_event_log: Log de eventos para debug/replay
--
-- Funções criadas:
-- - is_habit_due: Verifica se um hábito é devido em uma data
-- - vitality_close_day: Fecha um dia específico (aplica penalidades)
-- - vitality_close_days_until: Fecha múltiplos dias pendentes
-- - vitality_apply_event: Aplica evento de gamificação
-- - vitality_sync_open: Sincroniza na abertura do app
--
-- Para testar:
-- SELECT vitality_sync_open('seu-user-id-aqui');
-- SELECT vitality_apply_event('seu-user-id', gen_random_uuid(), 'HABIT_DONE', '{}', 0);
