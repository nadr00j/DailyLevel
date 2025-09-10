# Instruções para Criar Tabela PixelBuddy no Supabase

## 🚨 **ERRO ATUAL:**
```
Could not find the table 'public.pixelbuddy_state' in the schema cache
```

## ✅ **SOLUÇÃO:**

### **1. Acesse o Supabase Dashboard**
- Vá para: https://supabase.com/dashboard
- Entre no seu projeto

### **2. Execute o SQL**
- Clique em **"SQL Editor"** no menu lateral
- Clique em **"New query"**
- Copie e cole o conteúdo do arquivo `create-pixelbuddy-state-table.sql`
- Clique em **"Run"**

### **3. Verificar se a Tabela foi Criada**
- Vá para **"Table Editor"** no menu lateral
- Procure pela tabela `pixelbuddy_state`
- Deve aparecer com as colunas:
  - `id` (UUID, Primary Key)
  - `user_id` (UUID, Foreign Key)
  - `body` (TEXT)
  - `head` (TEXT)
  - `clothes` (TEXT)
  - `accessory` (TEXT)
  - `hat` (TEXT)
  - `effect` (TEXT)
  - `inventory` (JSONB)
  - `created_at` (TIMESTAMP)
  - `updated_at` (TIMESTAMP)

### **4. Testar a Aplicação**
- Recarregue a aplicação
- Tente comprar e equipar itens
- Verifique se não há mais erros 404

## 📋 **Estrutura da Tabela:**

```sql
CREATE TABLE public.pixelbuddy_state (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body TEXT,
    head TEXT,
    clothes TEXT,
    accessory TEXT,
    hat TEXT,
    effect TEXT,
    inventory JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);
```

## 🔒 **Segurança:**
- ✅ RLS (Row Level Security) habilitado
- ✅ Política: usuários só podem acessar seus próprios dados
- ✅ Trigger automático para `updated_at`

## 🎯 **Após Executar:**
O sistema de inventário e PixelBuddy funcionará perfeitamente com:
- ✅ Sincronização automática com Supabase
- ✅ Persistência de equipamentos
- ✅ Inventário funcional
- ✅ Sem perda de dados entre sessões
