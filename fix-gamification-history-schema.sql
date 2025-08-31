-- Script para atualizar schema de gamification_history
ALTER TABLE gamification_history
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';
ALTER TABLE gamification_history
  ADD COLUMN IF NOT EXISTS category text;
