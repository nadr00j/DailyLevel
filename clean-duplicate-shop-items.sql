-- LIMPAR ITENS DUPLICADOS DA LOJA
-- Este script remove itens duplicados mantendo apenas um de cada tipo

-- 1. VERIFICAR ITENS DUPLICADOS
SELECT 
    name, 
    COUNT(*) as quantidade,
    array_agg(id) as ids
FROM shop_items 
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47'
GROUP BY name 
HAVING COUNT(*) > 1
ORDER BY quantidade DESC;

-- 2. MANTER APENAS O PRIMEIRO ITEM DE CADA TIPO E REMOVER DUPLICATAS
WITH duplicates AS (
    SELECT 
        id,
        name,
        ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at ASC) as rn
    FROM shop_items 
    WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47'
)
DELETE FROM shop_items 
WHERE id IN (
    SELECT id 
    FROM duplicates 
    WHERE rn > 1
);

-- 3. VERIFICAR RESULTADO
SELECT 
    name, 
    COUNT(*) as quantidade
FROM shop_items 
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47'
GROUP BY name 
ORDER BY quantidade DESC;
