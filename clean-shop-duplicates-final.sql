-- LIMPAR DUPLICADOS DA LOJA NO SUPABASE
-- Este script remove todos os duplicados mantendo apenas um de cada tipo

-- 1. VERIFICAR DUPLICADOS ATUAIS
SELECT 
    name,
    category,
    COUNT(*) as quantidade,
    array_agg(id) as ids
FROM shop_items 
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47'
GROUP BY name, category 
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 2. MANTER APENAS O ITEM MAIS RECENTE DE CADA TIPO E REMOVER DUPLICATAS
WITH duplicates AS (
    SELECT 
        id,
        name,
        category,
        ROW_NUMBER() OVER (PARTITION BY name, category ORDER BY updated_at DESC, created_at DESC) as rn
    FROM shop_items 
    WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47'
)
DELETE FROM shop_items 
WHERE id IN (
    SELECT id 
    FROM duplicates 
    WHERE rn > 1
);

-- 3. VERIFICAR RESULTADO - DEVE TER APENAS 2 ITENS (Boost de XP e Efeito Confete)
SELECT 
    name,
    category,
    COUNT(*) as quantidade,
    array_agg(id) as ids
FROM shop_items 
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47'
GROUP BY name, category
ORDER BY name;

-- 4. VERIFICAR TOTAL DE ITENS
SELECT COUNT(*) as total_itens FROM shop_items 
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47';
