-- Script para testar se o sistema de vitalidade V2.1 está funcionando
-- Execute este script no Supabase SQL Editor

-- 1. Verificar estado da vitalidade do usuário
SELECT 
  'user_vitality_state' as tabela,
  COUNT(*) as total_registros,
  MIN(value) as min_vitality,
  MAX(value) as max_vitality,
  AVG(value) as avg_vitality
FROM user_vitality_state;

-- 2. Verificar penalidades de hábitos aplicadas
SELECT 
  'habit_miss_ledger' as tabela,
  COUNT(*) as total_penalidades,
  COUNT(DISTINCT user_id) as usuarios_penalizados,
  COUNT(DISTINCT habit_id) as habitos_penalizados
FROM habit_miss_ledger;

-- 3. Verificar penalidades de tarefas aplicadas
SELECT 
  'task_overdue_ledger' as tabela,
  COUNT(*) as total_penalidades,
  COUNT(DISTINCT user_id) as usuarios_penalizados,
  COUNT(DISTINCT task_id) as tarefas_penalizadas
FROM task_overdue_ledger;

-- 4. Verificar eventos de gamificação processados
SELECT 
  'vitality_event_log' as tabela,
  COUNT(*) as total_eventos,
  COUNT(DISTINCT user_id) as usuarios_com_eventos,
  COUNT(DISTINCT type) as tipos_eventos
FROM vitality_event_log;

-- 5. Detalhes dos eventos por tipo
SELECT 
  type,
  COUNT(*) as quantidade,
  MIN(applied_at) as primeiro_evento,
  MAX(applied_at) as ultimo_evento
FROM vitality_event_log
GROUP BY type
ORDER BY quantidade DESC;

-- 6. Estado detalhado de um usuário específico (substitua o UUID)
-- SELECT 
--   vs.value as vitalidade_atual,
--   vs.version as versao,
--   vs.last_close_date as ultimo_fechamento,
--   vs.updated_at as ultima_atualizacao
-- FROM user_vitality_state vs
-- WHERE vs.user_id = 'SEU_USER_ID_AQUI';

-- 7. Eventos recentes de um usuário (substitua o UUID)
-- SELECT 
--   type,
--   payload,
--   applied_at
-- FROM vitality_event_log
-- WHERE user_id = 'SEU_USER_ID_AQUI'
-- ORDER BY applied_at DESC
-- LIMIT 10;
