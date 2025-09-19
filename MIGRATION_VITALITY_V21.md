# Migração para Vitalidade V2.1 - Guia Completo

## 📋 Resumo das Mudanças

O sistema de vitalidade foi completamente reestruturado para seguir a especificação V2.1, que implementa:

- **Vitalidade única** gerenciada pelo PixelBuddy (corações, corpo, mood)
- **Sistema event-driven** baseado em eventos de gamificação
- **Sincronização com Supabase** como fonte da verdade
- **Fechamento diário automático** com penalidades por hábitos/tarefas não completados
- **Remoção da vitalidade** dos relatórios de performance

## 🗂️ Arquivos Criados

### 1. Tabelas e Funções SQL
- `create-vitality-v21-tables.sql` - Tabelas do sistema V2.1 (usa tabelas existentes)
- `create-vitality-v21-functions.sql` - Funções RPC para vitalidade

### 2. Hooks e Stores
- `src/hooks/useVitalityV21.ts` - Hook para gerenciar vitalidade V2.1
- `src/stores/useGamificationStoreV21.ts` - Store simplificado de gamificação

### 3. Componentes
- `src/components/gamification/VitalityListener.tsx` - Listener de eventos de vitalidade

## 🔄 Arquivos Modificados

### 1. Relatórios de Performance
- `src/components/reports/PerformanceReports.tsx`
  - ❌ Removida seção de vitalidade
  - ❌ Removido cálculo de vitalidade
  - ❌ Removido import do ícone Heart

### 2. PixelBuddy
- `src/components/gamification/PixelBuddyCard.tsx`
  - ✅ Atualizado para usar `useVitalityV21`
  - ✅ Atualizado para usar `useGamificationStoreV21`

### 3. App Principal
- `src/App.tsx`
  - ✅ Adicionado `VitalityListener` para escutar eventos

## 🚀 Passos para Migração

### Passo 1: Executar Scripts SQL
```sql
-- 1. Executar no Supabase SQL Editor
\i create-vitality-v21-tables.sql
\i create-vitality-v21-functions.sql
```

**Nota**: Os scripts foram ajustados para usar as tabelas existentes:
- `habits` (em vez de `habit`)
- `habit_completions` (em vez de `habit_completion`) 
- `tasks` (em vez de `task`)

### Passo 2: Atualizar Imports (Opcional)
Se você quiser migrar completamente para o sistema V2.1, atualize os imports:

```typescript
// Antes
import { useGamificationStore } from '@/stores/useGamificationStore';

// Depois
import { useGamificationStoreV21 } from '@/stores/useGamificationStoreV21';
import { useVitalityV21 } from '@/hooks/useVitalityV21';
```

### Passo 3: Verificar Funcionamento
1. **PixelBuddy**: Verificar se corações, corpo e mood estão funcionando
2. **Eventos**: Testar conclusão de hábitos, tarefas e metas
3. **Sincronização**: Verificar se dados estão sendo salvos no Supabase

## 🔧 Configuração do Sistema V2.1

### Parâmetros de Vitalidade
```typescript
// Penalidades
penalty_per_miss_base = 4        // Penalidade base por hábito não completado
penalty_overdue_per_day = 2      // Penalidade por tarefa atrasada por dia
daily_penalty_cap = 20           // Cap diário de penalidades

// Ganhos
habit_done_gain = 0.5            // Ganho por hábito completado
goal_done_gain = 2               // Ganho por meta completada
daily_gain_cap = 10              // Cap diário de ganhos

// Fragilidade no topo
top_fragility_lambda = 6.0       // Multiplicador de fragilidade (90+)
```

### Escassez de Hábitos
Hábitos pouco frequentes causam mais penalidade:
- **Diário**: 1.0x (penalidade normal)
- **Semanal**: 2.0x (penalidade dobrada)
- **Mensal**: 2.0x (penalidade dobrada)

## 📊 Monitoramento

### Logs de Eventos
Todos os eventos são registrados na tabela `vitality_event_log`:
```sql
SELECT * FROM vitality_event_log 
WHERE user_id = 'seu-user-id' 
ORDER BY applied_at DESC;
```

### Estado da Vitalidade
```sql
SELECT * FROM user_vitality_state 
WHERE user_id = 'seu-user-id';
```

### Ledgers de Penalidades
```sql
-- Hábitos não completados
SELECT * FROM habit_miss_ledger 
WHERE user_id = 'seu-user-id' 
ORDER BY date DESC;

-- Tarefas atrasadas
SELECT * FROM task_overdue_ledger 
WHERE user_id = 'seu-user-id' 
ORDER BY date DESC;
```

## 🐛 Troubleshooting

### Problema: Vitalidade não atualiza
**Solução**: Verificar se o `VitalityListener` está sendo renderizado no App.tsx

### Problema: Eventos não são aplicados
**Solução**: Verificar se as funções RPC estão criadas no Supabase

### Problema: Conflito de versão
**Solução**: O sistema automaticamente refaz a sincronização quando há conflito

### Problema: PixelBuddy não muda
**Solução**: Verificar se o `useVitalityV21` está sendo usado no PixelBuddyCard

## 🔄 Rollback (Se Necessário)

Para voltar ao sistema anterior:

1. **Reverter imports** nos componentes
2. **Remover** `VitalityListener` do App.tsx
3. **Restaurar** seção de vitalidade nos relatórios
4. **Usar** `useGamificationStore` original

## 📈 Benefícios do Sistema V2.1

1. **Consistência**: Vitalidade única em todo o app
2. **Performance**: Cálculos no servidor, não no cliente
3. **Confiabilidade**: Sincronização automática com Supabase
4. **Simplicidade**: Lógica de vitalidade centralizada
5. **Escalabilidade**: Sistema event-driven preparado para crescimento

## 🎯 Próximos Passos

1. **Testar** o sistema em desenvolvimento
2. **Migrar** dados existentes se necessário
3. **Configurar** cron job para fechamento diário (opcional)
4. **Monitorar** logs e performance
5. **Ajustar** parâmetros conforme necessário

---

**Nota**: O sistema V2.1 é compatível com o sistema anterior. Você pode migrar gradualmente ou manter ambos funcionando em paralelo durante o período de transição.
