-- Correção para a função vitality_sync_open
-- Execute este script no Supabase SQL Editor

-- RPC para sincronizar na abertura do app (versão corrigida)
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
