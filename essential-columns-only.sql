-- COMANDOS ESSENCIAIS - Execute um por vez se necessário

-- TASKS - Colunas faltantes
ALTER TABLE tasks ADD COLUMN week_start DATE;
ALTER TABLE tasks ADD COLUMN week_end DATE;
ALTER TABLE tasks ADD COLUMN overdue BOOLEAN DEFAULT false;
ALTER TABLE tasks ADD COLUMN order_index INTEGER DEFAULT 0;

-- GOALS - Colunas faltantes
ALTER TABLE goals ADD COLUMN icon_value TEXT DEFAULT 'target';
ALTER TABLE goals ADD COLUMN target_value INTEGER DEFAULT 100;
ALTER TABLE goals ADD COLUMN current_value INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN unit TEXT DEFAULT 'unidades';
ALTER TABLE goals ADD COLUMN deadline DATE;
ALTER TABLE goals ADD COLUMN is_completed BOOLEAN DEFAULT false;
ALTER TABLE goals ADD COLUMN is_future BOOLEAN DEFAULT false;

-- USER_GAMIFICATION - Colunas faltantes
ALTER TABLE user_gamification ADD COLUMN mood TEXT DEFAULT 'neutral';
ALTER TABLE user_gamification ADD COLUMN xp_multiplier DECIMAL(3,2) DEFAULT 1.0;
ALTER TABLE user_gamification ADD COLUMN xp_multiplier_expiry BIGINT DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN rank_idx INTEGER DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN rank_tier TEXT DEFAULT 'Bronze';
ALTER TABLE user_gamification ADD COLUMN rank_div INTEGER DEFAULT 1;
ALTER TABLE user_gamification ADD COLUMN aspect TEXT DEFAULT 'int';
ALTER TABLE user_gamification ADD COLUMN cre INTEGER DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN soc INTEGER DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN str INTEGER DEFAULT 0;
ALTER TABLE user_gamification ADD COLUMN int INTEGER DEFAULT 0;
