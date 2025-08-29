-- CORRIGIR ERRO 406 NO USER_GAMIFICATION
-- Este script verifica e corrige problemas na tabela user_gamification

-- 1. VERIFICAR ESTRUTURA DA TABELA
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'user_gamification'
ORDER BY ordinal_position;

-- 2. VERIFICAR DADOS EXISTENTES
SELECT * FROM user_gamification 
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47';

-- 3. VERIFICAR SE RLS ESTÁ DESABILITADO
SELECT 
    schemaname, 
    tablename, 
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'user_gamification';

-- 4. SE NÃO EXISTIR DADOS, CRIAR REGISTRO INICIAL
-- Primeiro, verificar se já existe um registro
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM user_gamification WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47') THEN
        INSERT INTO user_gamification (
            user_id, 
            xp, 
            coins, 
            xp30d, 
            vitality, 
            mood, 
            xp_multiplier, 
            xp_multiplier_expiry, 
            str, 
            int, 
            cre, 
            soc, 
            aspect, 
            rank_idx, 
            rank_tier, 
            rank_div
        ) VALUES (
            '7ceee0d2-d938-4106-880e-dbb7e976bb47',
            0,
            0,
            0,
            100,
            'neutral',
            1.0,
            0,
            0,
            0,
            0,
            0,
            'int',
            0,
            'Bronze',
            1
        );
    END IF;
END $$;

-- 5. VERIFICAR RESULTADO
SELECT * FROM user_gamification 
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47';
