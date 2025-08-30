-- Migração: adicionar colunas 'category', 'due_date', 'week_start', 'week_end', 'overdue' à tabela tasks
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMP,
  ADD COLUMN IF NOT EXISTS week_start TIMESTAMP,
  ADD COLUMN IF NOT EXISTS week_end TIMESTAMP,
  ADD COLUMN IF NOT EXISTS overdue BOOLEAN DEFAULT FALSE;
