-- Script para criar tabela history_items
CREATE TABLE IF NOT EXISTS history_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  ts timestamp with time zone NOT NULL,
  type text NOT NULL,
  xp integer NOT NULL,
  coins integer NOT NULL,
  category text,
  tags text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
);

-- Índices para otimizar consultas por usuário e período
CREATE INDEX IF NOT EXISTS idx_history_items_user_ts ON history_items(user_id, ts DESC);
