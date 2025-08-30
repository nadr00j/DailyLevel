-- Migração: alterar coluna 'id' da tabela shop_items de UUID para TEXT
ALTER TABLE shop_items
  ALTER COLUMN id DROP DEFAULT,
  ALTER COLUMN id TYPE TEXT USING id::TEXT;
