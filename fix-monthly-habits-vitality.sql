-- Atualizar função is_habit_due para não penalizar hábitos mensais

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
  
  -- Hábito mensal - NUNCA aplicar penalidade de vitalidade
  -- Os hábitos mensais não devem gerar penalidade diária
  IF frequency = 'monthly' THEN
    RETURN FALSE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
