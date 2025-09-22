-- Correção das funções de vitalidade V2.1
-- Execute este script no Supabase SQL Editor

-- Corrigir função vitality_close_day para usar a estrutura correta da tabela tasks
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

  -- 2) TAREFAS atrasadas em p_date (CORRIGIDO: usar 'completed' em vez de 'completed_date')
  FOR t IN
    SELECT id FROM tasks
    WHERE user_id = p_user 
      AND due_date <= p_date 
      AND completed = false  -- CORRIGIDO: usar 'completed' boolean
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
