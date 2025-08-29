-- LIMPAR REGISTROS DUPLICADOS DO USER_GAMIFICATION
-- Este script remove registros duplicados mantendo apenas o mais recente

-- 1. VERIFICAR QUANTIDADE DE REGISTROS DUPLICADOS
SELECT 
    user_id, 
    COUNT(*) as total_registros
FROM user_gamification 
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47'
GROUP BY user_id;

-- 2. MANTER APENAS O REGISTRO MAIS RECENTE E REMOVER DUPLICATAS
WITH latest_record AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (ORDER BY updated_at DESC, created_at DESC) as rn
    FROM user_gamification 
    WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47'
)
DELETE FROM user_gamification 
WHERE id IN (
    SELECT id 
    FROM latest_record 
    WHERE rn > 1
);

-- 3. VERIFICAR RESULTADO - DEVE TER APENAS 1 REGISTRO
SELECT 
    user_id, 
    COUNT(*) as total_registros,
    MAX(updated_at) as ultima_atualizacao
FROM user_gamification 
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47'
GROUP BY user_id;

-- 4. MOSTRAR O REGISTRO FINAL
SELECT * FROM user_gamification 
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47';
