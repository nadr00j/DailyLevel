-- Script para atualizar schema da tabela habits
ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS icon_type text,
  ADD COLUMN IF NOT EXISTS icon_value text,
  ADD COLUMN IF NOT EXISTS categories text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS frequency text DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS target_count int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS target_days int[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS order_index int DEFAULT 0;
