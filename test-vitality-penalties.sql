-- Script para testar penalidades de vitalidade V2.1
-- Execute este script no Supabase SQL Editor

-- 1. Verificar hábitos ativos do usuário
SELECT 
  h.id,
  h.title,
  h.frequency,
  h.target_days,
  h.is_active,
  h.created_at
FROM habits h
WHERE h.user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47'
  AND h.is_active = true
ORDER BY h.created_at DESC;

-- 2. Verificar conclusões de hábitos recentes
SELECT 
  hc.habit_id,
  h.title as habit_name,
  hc.completion_date,
  h.frequency
FROM habit_completions hc
JOIN habits h ON h.id = hc.habit_id
WHERE h.user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47'
ORDER BY hc.completion_date DESC
LIMIT 10;

-- 3. Verificar se há hábitos que deveriam ter penalidades
-- (hábitos ativos criados há mais de 1 dia, mas sem conclusão recente)
SELECT 
  h.id,
  h.title,
  h.frequency,
  h.created_at,
  MAX(hc.completion_date) as ultima_conclusao,
  CURRENT_DATE - MAX(hc.completion_date) as dias_sem_conclusao
FROM habits h
LEFT JOIN habit_completions hc ON h.id = hc.habit_id
WHERE h.user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47'
  AND h.is_active = true
  AND h.created_at < CURRENT_DATE - INTERVAL '1 day'
GROUP BY h.id, h.title, h.frequency, h.created_at
HAVING MAX(hc.completion_date) < CURRENT_DATE - INTERVAL '1 day'
   OR MAX(hc.completion_date) IS NULL
ORDER BY dias_sem_conclusao DESC;

-- 4. Testar fechamento manual de um dia específico
-- (substitua a data por um dia que você não completou hábitos)
-- SELECT vitality_close_day('7ceee0d2-d938-4106-880e-dbb7e976bb47', '2025-09-18'::DATE);

-- 5. Verificar estado atual da vitalidade
SELECT 
  value as vitalidade_atual,
  version as versao,
  last_close_date as ultimo_fechamento,
  updated_at as ultima_atualizacao
FROM user_vitality_state
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47';
