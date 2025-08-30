-- Migração: adicionar coluna 'bucket' à tabela tasks
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS bucket TEXT NOT NULL DEFAULT 'today';
-- Opcional: adicionar constraint para valores específicos
ALTER TABLE tasks
  ADD CONSTRAINT tasks_bucket_check CHECK (bucket IN ('today','week','later'));
