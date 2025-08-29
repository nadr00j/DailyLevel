-- CORRIGIR CATEGORIAS DOS ITENS DA LOJA
-- Este script verifica e corrige as categorias dos itens da loja

-- 1. VERIFICAR ITENS ATUAIS NA LOJA
SELECT 
    id,
    name,
    category,
    price,
    purchased
FROM shop_items 
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47'
ORDER BY category, name;

-- 2. VERIFICAR SE HÁ ITENS COM CATEGORIA INCORRETA
SELECT 
    name,
    category,
    COUNT(*) as quantidade
FROM shop_items 
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47'
GROUP BY name, category
ORDER BY quantidade DESC;

-- 3. CORRIGIR CATEGORIA DO EFEITO CONFETE (se estiver como 'cosmetic')
UPDATE shop_items 
SET category = 'vantagens'
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47' 
AND name = 'Efeito Confete' 
AND category = 'cosmetic';

-- 4. CORRIGIR CATEGORIA DO BOOST DE XP (se estiver como 'boost')
UPDATE shop_items 
SET category = 'vantagens'
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47' 
AND name = 'Boost de XP' 
AND category = 'boost';

-- 5. VERIFICAR RESULTADO APÓS CORREÇÕES
SELECT 
    category,
    COUNT(*) as quantidade,
    array_agg(name) as itens
FROM shop_items 
WHERE user_id = '7ceee0d2-d938-4106-880e-dbb7e976bb47'
GROUP BY category
ORDER BY category;
