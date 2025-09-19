-- Script para verificar se as tabelas de vitalidade V2.1 existem
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se as tabelas existem
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'user_vitality_state',
    'habit_miss_ledger', 
    'task_overdue_ledger',
    'vitality_event_log'
  )
ORDER BY table_name;

-- 2. Verificar se as funções RPC existem
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'vitality_sync_open',
    'vitality_apply_event',
    'vitality_close_day',
    'vitality_close_days_until',
    'is_habit_due'
  )
ORDER BY routine_name;

-- 3. Verificar estrutura da tabela user_vitality_state (se existir)
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_vitality_state'
ORDER BY ordinal_position;

-- 4. Verificar se há dados na tabela user_vitality_state
SELECT COUNT(*) as total_users FROM user_vitality_state;

-- 5. Verificar se há dados na tabela vitality_event_log
SELECT COUNT(*) as total_events FROM vitality_event_log;

-- 6. Verificar se há dados na tabela habit_miss_ledger
SELECT COUNT(*) as total_misses FROM habit_miss_ledger;

-- 7. Verificar se há dados na tabela task_overdue_ledger
SELECT COUNT(*) as total_overdue FROM task_overdue_ledger;
