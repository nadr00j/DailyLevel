# Sistema de Vitalidade, Corpo e Mood - DailyLevel

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Cálculo da Vitalidade](#cálculo-da-vitalidade)
3. [Sistema de Corpo do PixelBuddy](#sistema-de-corpo-do-pixelbuddy)
4. [Sistema de Cabeça/Humor](#sistema-de-cabeçahumor)
5. [Vitalidade nos Relatórios](#vitalidade-nos-relatórios)
6. [Renderização do PixelBuddy](#renderização-do-pixelbuddy)
7. [Atributos STR/INT/CRE/SOC](#atributos-strintcresoc)
8. [Configuração](#configuração)
9. [Fluxo Completo](#fluxo-completo)
10. [Exemplos Práticos](#exemplos-práticos)

---

## 🎯 Visão Geral

O sistema de vitalidade do DailyLevel é um mecanismo complexo que transforma as ações do usuário em uma narrativa visual através do PixelBuddy. A vitalidade reflete não apenas o progresso (XP), mas também a consistência, penalidades e bônus do usuário.

### Componentes Principais:
- **Vitalidade**: Indicador 0-100% baseado em múltiplos fatores
- **Corpo**: Evolui baseado no XP total acumulado
- **Humor**: Reflete o estado emocional baseado na vitalidade
- **Atributos**: STR, INT, CRE, SOC que definem o aspecto do avatar

---

## 📊 Cálculo da Vitalidade

### Localização: `src/stores/useGamificationStore.ts`

A vitalidade é calculada através da função `calcVitality()` com **7 componentes principais**:

```typescript
function calcVitality(xp30d: number, cfg: GamificationConfig, history: any[]) {
  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.getTime();
  const todayEnd = todayStart + (24 * 60 * 60 * 1000) - 1;
  
  // 1. BASE: Vitalidade baseada no XP dos últimos 30 dias
  const baseVitality = Math.min(100, (xp30d / cfg.points.vitalityMonthlyTarget) * 100);
  
  // 2. HÁBITOS: Penalizar hábitos não completados hoje
  let habitPenalty = 0;
  try {
    const habits = useHabitStore.getState().habits;
    const totalHabits = Object.keys(habits).length;
    if (totalHabits > 0) {
      const completedHabitsToday = history.filter(item => 
        item.type === 'habit' && 
        item.ts >= todayStart && 
        item.ts <= todayEnd
      ).length;
      
      const missedHabits = totalHabits - completedHabitsToday;
      habitPenalty = (missedHabits / totalHabits) * 30; // 30 pontos de penalidade máxima
    }
  } catch (error) {
    console.warn('Erro ao acessar hábitos para cálculo de vitalidade:', error);
  }
  
  // 3. TAREFAS: Penalizar tarefas atrasadas (temporariamente desabilitado)
  let taskPenalty = 0;
  // TODO: Implementar cálculo de penalidade de tarefas sem usar hooks
  
  // 4. METAS: Bônus por metas concluídas (sem penalidade)
  let goalBonus = 0;
  const completedGoalsToday = history.filter(item => 
    item.type === 'goal' && 
    item.ts >= todayStart && 
    item.ts <= todayEnd
  ).length;
  
  goalBonus = completedGoalsToday * 5; // 5 pontos por meta concluída
  
  // 5. USO DO APP: Penalizar se não entrou hoje
  let appUsagePenalty = 0;
  const hasActivityToday = history.some(item => 
    item.ts >= todayStart && item.ts <= todayEnd
  );
  
  if (!hasActivityToday) {
    appUsagePenalty = 20; // 20 pontos de penalidade por não usar o app
  }
  
  // 6. CONSISTÊNCIA: Bônus por uso diário nos últimos 7 dias
  let consistencyBonus = 0;
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  });
  
  const activeDays = last7Days.filter(dayStart => {
    const dayEnd = dayStart + (24 * 60 * 60 * 1000) - 1;
    return history.some(item => item.ts >= dayStart && item.ts <= dayEnd);
  }).length;
  
  consistencyBonus = (activeDays / 7) * 15; // Até 15 pontos por consistência
  
  // 7. CALCULAR VITALIDADE FINAL
  const finalVitality = Math.max(0, Math.min(100, 
    baseVitality - habitPenalty - taskPenalty - appUsagePenalty + goalBonus + consistencyBonus
  ));
  
  return finalVitality;
}
```

### Componentes Detalhados:

#### 1. **Base (XP dos últimos 30 dias)**
```typescript
const baseVitality = Math.min(100, (xp30d / cfg.points.vitalityMonthlyTarget) * 100);
```
- **Meta mensal**: 500 XP (configurável)
- **Cálculo**: XP dos últimos 30 dias ÷ 500 × 100
- **Limite**: Máximo 100%

#### 2. **Penalidade por Hábitos Não Completados**
```typescript
const missedHabits = totalHabits - completedHabitsToday;
habitPenalty = (missedHabits / totalHabits) * 30; // 30 pontos máximos
```
- **Penalidade**: 30 pontos máximos se não completar nenhum hábito
- **Cálculo**: (Hábitos perdidos ÷ Total de hábitos) × 30

#### 3. **Bônus por Metas Concluídas**
```typescript
goalBonus = completedGoalsToday * 5; // 5 pontos por meta
```
- **Bônus**: 5 pontos por meta concluída no dia

#### 4. **Penalidade por Não Usar o App**
```typescript
if (!hasActivityToday) {
  appUsagePenalty = 20; // 20 pontos de penalidade
}
```
- **Penalidade**: 20 pontos se não houver atividade no dia

#### 5. **Bônus de Consistência (7 dias)**
```typescript
consistencyBonus = (activeDays / 7) * 15; // Até 15 pontos
```
- **Bônus**: Até 15 pontos por uso diário nos últimos 7 dias

#### 6. **Cálculo Final**
```typescript
const finalVitality = Math.max(0, Math.min(100, 
  baseVitality - habitPenalty - taskPenalty - appUsagePenalty + goalBonus + consistencyBonus
));
```

---

## 🏃 Sistema de Corpo do PixelBuddy

### Localização: `src/stores/useGamificationStore.ts` - função `updatePixelBuddyState()`

O corpo do PixelBuddy evolui baseado no **XP total acumulado**:

```typescript
function updatePixelBuddyState(xp: number, vitality: number, mood: string) {
  const pixelBuddyStore = usePixelBuddyStore.getState();
  
  // Atualizar body baseado no XP
  let newBody: string;
  if (xp < 200) {
    newBody = '/Nadr00J/bodies/body_lvl1.png';      // 🌱 Iniciante
  } else if (xp < 600) {
    newBody = '/Nadr00J/bodies/body_lvl2.png';      // 🏃 Engajado  
  } else {
    newBody = '/Nadr00J/bodies/body_lvl3.png';      // 💪 Forte
  }
  
  // Aplicar mudanças apenas se diferentes
  if (pixelBuddyStore.body !== newBody) {
    pixelBuddyStore.setBase('body', newBody);
  }
}
```

### Estados Visuais por Vitalidade:

| Vitalidade | Estado | Emoji | Aparência | Sprite |
|------------|--------|-------|-----------|---------|
| 0-25% | 🌱 Iniciante | 🌱 | Frágil, pálido, postura neutra | `body_lvl1.png` |
| 26-60% | 🏃 Engajado | 🏃 | Passo ativo, sorriso leve | `body_lvl2.png` |
| 61-90% | 💪 Forte | 💪 | Definição, energia visível | `body_lvl3.png` |
| 91-100% | 🦸 Épico | 🦸 | Aura/capa, pose heróica | `body_lvl3.png` + efeitos |

### Níveis de Corpo:

1. **Nível 1 (0-199 XP)**: `body_lvl1.png`
   - Corpo mais magro e frágil
   - Postura neutra
   - Representa iniciante

2. **Nível 2 (200-599 XP)**: `body_lvl2.png`
   - Corpo mais definido
   - Postura mais confiante
   - Representa engajamento

3. **Nível 3 (600+ XP)**: `body_lvl3.png`
   - Corpo musculoso e forte
   - Postura heroica
   - Representa experiência

---

## 😊 Sistema de Cabeça/Humor

### Localização: `src/stores/useGamificationStore.ts`

O humor é determinado pela **vitalidade atual** e reflete o estado emocional do avatar:

```typescript
function updatePixelBuddyState(xp: number, vitality: number, mood: string) {
  // Atualizar head baseado na vitalidade e humor
  let newHead: string;
  if (vitality < 25) {
    newHead = '/Nadr00J/heads/head_tired.png';        // 😴 Cansado
  } else if (vitality < 50) {
    newHead = '/Nadr00J/heads/head_sad.png';          // 😢 Triste
  } else if (vitality < 75) {
    newHead = '/Nadr00J/heads/head_neutral.png';      // 😐 Neutro
  } else if (vitality < 90) {
    newHead = '/Nadr00J/heads/head_happy.png';        // 😊 Feliz
  } else {
    newHead = '/Nadr00J/heads/head_confident.png';    // 😎 Confiante
  }
  
  if (pixelBuddyStore.head !== newHead) {
    pixelBuddyStore.setBase('head', newHead);
  }
}
```

### Função de Determinação do Humor:

```typescript
function getMoodFromVitality(vitality: number): string {
  if (vitality < 25) return 'sad';
  if (vitality < 50) return 'tired';
  if (vitality < 75) return 'neutral';
  return 'happy';
}
```

### Estados de Humor:

| Vitalidade | Humor | Emoji | Sprite | Descrição |
|------------|-------|-------|---------|-----------|
| 0-24% | tired | 😴 | `head_tired.png` | Cansado, olhos fechados |
| 25-49% | sad | 😢 | `head_sad.png` | Triste, expressão melancólica |
| 50-74% | neutral | 😐 | `head_neutral.png` | Neutro, expressão normal |
| 75-89% | happy | 😊 | `head_happy.png` | Feliz, sorriso leve |
| 90-100% | confident | 😎 | `head_confident.png` | Confiante, sorriso largo |

---

## 📊 Vitalidade nos Relatórios

### Localização: `src/components/reports/PerformanceReports.tsx`

Nos relatórios de performance, a vitalidade é calculada de forma **simplificada** baseada no período selecionado:

```typescript
const currentStats = useMemo(() => {
  const ph = filteredHistory;
  const totalXP = ph.reduce((sum, item) => sum + item.xp, 0);
  
  // vitality based on XP relative to configured period targets
  let vitalityPercent = 0;
  const xpPerPeriod = activePeriod === 'day' ? 20 : activePeriod === 'week' ? 100 : 500;
  vitalityPercent = Math.min(100, (totalXP / xpPerPeriod) * 100);
  
  return { 
    totalXP, 
    tasksCompleted, 
    habitsMaintained, 
    goalsCompleted, 
    vitality: vitalityPercent, 
    streak: 0 
  };
}, [filteredHistory, activePeriod, habits]);
```

### Metas por Período:

| Período | Meta de XP | Cálculo |
|---------|------------|---------|
| **Dia** | 20 XP | `(XP do dia ÷ 20) × 100` |
| **Semana** | 100 XP | `(XP da semana ÷ 100) × 100` |
| **Mês** | 500 XP | `(XP do mês ÷ 500) × 100` |

### Exemplo de Cálculo:

```typescript
// Se o usuário ganhou 15 XP hoje:
const totalXP = 15;
const xpPerPeriod = 20; // Meta diária
const vitalityPercent = Math.min(100, (15 / 20) * 100); // = 75%
```

---

## 🎨 Renderização do PixelBuddy

### Localização: `src/components/gamification/PixelBuddyRenderer.tsx`

O PixelBuddy é renderizado através de um sistema de **camadas sobrepostas**:

```typescript
export const PixelBuddyRenderer: React.FC<{ size?: number }> = ({ size = 128 }) => {
  const { body, head, clothes, accessory, hat, effect } = usePixelBuddyStore();

  const layers: Array<{ src: string | null; key: string }> = [
    { src: clothes?.includes('clothes_suit') ? null : body, key: 'body' },
    { src: clothes, key: 'clothes' },
    { src: head, key: 'head' },
    { src: accessory, key: 'accessory' },
    { src: hat, key: 'hat' },
    { src: effect, key: 'effect' }
  ];

  return (
    <div className="relative select-none" style={{ width: size, height: size }}>
      {layers.map(({ src, key }) =>
        src ? (
          <motion.img
            key={key}
            src={src}
            alt={key}
            className="absolute inset-0"
            style={{
              width: layerStyles[key]?.width || '100%',
              height: layerStyles[key]?.height || '100%',
              marginTop: layerStyles[key]?.marginTop,
              marginLeft: layerStyles[key]?.marginLeft
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            draggable={false}
          />
        ) : null
      )}
    </div>
  );
};
```

### Sistema de Camadas:

```typescript
const layerStyles: Record<string, LayerStyle> = {
  body: {
    width: '85%',
    height: '85%',
    marginTop: '30px'
  },
  head: {
    width: '80%',
    height: '80%',
    marginTop: '-12px',
    marginLeft: '4px'
  },
  clothes: {
    width: '100%',
    height: '100%',
    marginTop: '20px',
    marginLeft: '-9px'
  },
  accessory: {
    width: '70%',
    height: '70%',
    marginTop: '-2px',
    marginLeft: '11px'
  },
  hat: {
    width: '90%',
    height: '90%',
    marginTop: '-44px',
    marginLeft: '-3px'
  }
};
```

### Ordem de Renderização:

1. **Body** (base) - Corpo do avatar
2. **Clothes** (roupas) - Roupas equipadas
3. **Head** (cabeça) - Expressão facial
4. **Accessory** (acessórios) - Itens menores
5. **Hat** (chapéu) - Chapéus e capacetes
6. **Effect** (efeitos) - Efeitos especiais

### Ajustes Especiais:

O sistema inclui ajustes manuais complexos para diferentes combinações de roupas e corpos:

```typescript
// Exemplo de ajuste para regata com corpo nível 3
width: key==='clothes' && src.includes('clothes_regata') ? 
       (body?.includes('body_lvl3') ? '85%' : '90%') :
       (layerStyles[key]?.width || '100%')
```

---

## 🏋️ Atributos STR/INT/CRE/SOC

### Localização: `src/stores/useGamificationStore.ts` - função `addXp()`

Os atributos são incrementados baseados nas **tags** das ações:

```typescript
addXp: (type, tags) => {
  // ... código de cálculo de XP ...
  
  // Incrementar atributos baseado nas tags
  const newStr = state.str + (safeTags.includes('fitness') ? finalXp : 0);
  const newInt = state.int + (safeTags.includes('study') ? finalXp : 0);
  const newCre = state.cre + (safeTags.includes('creativity') ? finalXp : 0);
  const newSoc = state.soc + (safeTags.includes('social') ? finalXp : 0);
  
  // Calcular novo aspecto
  let newAspect: Aspect = 'bal';
  try {
    newAspect = calcAspect(newStr, newInt, newCre, newSoc);
  } catch (error) {
    console.error('Erro ao calcular aspecto:', error);
  }
  
  // ... resto da função ...
}
```

### Mapeamento de Categorias:

```typescript
// Tags que incrementam cada atributo:
const strTags = ['fitness', 'saude', 'health', 'exercise', 'workout', 'gym'];
const intTags = ['estudo', 'study', 'learning', 'education', 'trabalho', 'work'];
const creTags = ['arte', 'art', 'drawing', 'painting', 'creativity', 'music'];
const socTags = ['social', 'friends', 'family', 'relationships', 'network'];
```

### Função de Cálculo do Aspecto:

```typescript
function calcAspect(str: number, int: number, cre: number, soc: number): Aspect {
  const max = Math.max(str, int, cre, soc);
  
  if (max === str) return 'str';
  if (max === int) return 'int';
  if (max === cre) return 'cre';
  if (max === soc) return 'soc';
  
  return 'bal'; // Balanceado se nenhum for dominante
}
```

### Tipos de Aspecto:

| Aspecto | Descrição | Atributo Dominante |
|---------|-----------|-------------------|
| `bal` | Balanceado | Nenhum dominante |
| `str` | Forte | STR (Fitness/Saúde) |
| `int` | Inteligente | INT (Estudo/Trabalho) |
| `cre` | Criativo | CRE (Arte/Criatividade) |
| `soc` | Social | SOC (Social/Relacionamentos) |

---

## ⚙️ Configuração

### Localização: `src/config/gamificationConfig.json`

```json
{
  "points": {
    "habit": 10,
    "task": 10,
    "milestone": 50,
    "goal": 30,
    "coinsPerXp": 0.1,
    "vitalityMonthlyTarget": 500,
    "vitalityDecayPerMissedDay": 5
  },
  "streaks": { 
    "bonus7": 10, 
    "bonus30": 30 
  },
  "categories": {
    "Arte": { 
      "tags": ["arte", "Arte", "art", "drawing", "painting"], 
      "target30d": 120, 
      "weight": 0.9 
    },
    "Estudo": { 
      "tags": ["estudo", "Estudo", "study", "learning", "education"], 
      "target30d": 150, 
      "weight": 1.1 
    },
    "Fitness": { 
      "tags": ["fitness", "Fitness", "exercise", "workout", "gym"], 
      "target30d": 200, 
      "weight": 1.0 
    },
    "Saúde": { 
      "tags": ["saude", "Saúde", "health", "medical", "wellness"], 
      "target30d": 150, 
      "weight": 1.0 
    },
    "Trabalho": { 
      "tags": ["trabalho", "Trabalho", "work", "career", "job"], 
      "target30d": 200, 
      "weight": 1.2 
    }
  }
}
```

### Parâmetros Configuráveis:

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `vitalityMonthlyTarget` | 500 | Meta mensal de XP para 100% vitalidade |
| `vitalityDecayPerMissedDay` | 5 | Decaimento de vitalidade por dia perdido |
| `target30d` | Varia | Meta de XP por categoria em 30 dias |
| `weight` | 0.6-1.2 | Peso da categoria no cálculo geral |

---

## 🔄 Fluxo Completo

### 1. **Usuário Completa Ação**
```typescript
// Exemplo: Completar um hábito
useHabitStore.getState().logCompletion(habitId, todayStr);
```

### 2. **XP é Adicionado**
```typescript
// Em useHabitStore.ts
const us = useGamificationStore.getState();
us.addXp('habit', [habit.name, ...(habit.category ? [habit.category] : [])]);
```

### 3. **Vitalidade é Recalculada**
```typescript
// Em useGamificationStore.ts
const newVitality = Math.floor(calcVitality(newXp30d, cfg, state.history));
```

### 4. **PixelBuddy é Atualizado**
```typescript
// Em useGamificationStore.ts
updatePixelBuddyState(newXp, newVitality, newMood);
```

### 5. **Humor é Determinado**
```typescript
// Em useGamificationStore.ts
const newMood = getMoodFromVitality(newVitality);
```

### 6. **Relatórios são Atualizados**
```typescript
// Em PerformanceReports.tsx
const vitalityPercent = Math.min(100, (totalXP / xpPerPeriod) * 100);
```

---

## 📝 Exemplos Práticos

### Exemplo 1: Usuário Iniciante

**Situação**: Usuário novo, 50 XP total, 2 hábitos, completou 1 hoje

```typescript
// Cálculo da vitalidade:
const baseVitality = (50 / 500) * 100 = 10%; // Base baixa
const habitPenalty = (1 / 2) * 30 = 15; // Penalidade por 1 hábito perdido
const finalVitality = Math.max(0, 10 - 15) = 0%; // Vitalidade mínima

// Resultado:
// - Corpo: body_lvl1.png (XP < 200)
// - Cabeça: head_sad.png (vitality < 25)
// - Humor: sad
```

### Exemplo 2: Usuário Engajado

**Situação**: 300 XP total, 5 hábitos, completou todos hoje, 1 meta concluída

```typescript
// Cálculo da vitalidade:
const baseVitality = (300 / 500) * 100 = 60%; // Base boa
const habitPenalty = 0; // Todos os hábitos completados
const goalBonus = 1 * 5 = 5; // Bônus por meta
const finalVitality = Math.min(100, 60 + 5) = 65%; // Vitalidade boa

// Resultado:
// - Corpo: body_lvl2.png (XP 200-599)
// - Cabeça: head_happy.png (vitality 50-74)
// - Humor: happy
```

### Exemplo 3: Usuário Experiente

**Situação**: 800 XP total, 10 hábitos, completou 8 hoje, 2 metas concluídas, uso consistente

```typescript
// Cálculo da vitalidade:
const baseVitality = (800 / 500) * 100 = 100%; // Base máxima
const habitPenalty = (2 / 10) * 30 = 6; // Pequena penalidade
const goalBonus = 2 * 5 = 10; // Bônus por metas
const consistencyBonus = (7 / 7) * 15 = 15; // Bônus máximo
const finalVitality = Math.min(100, 100 - 6 + 10 + 15) = 100%; // Vitalidade máxima

// Resultado:
// - Corpo: body_lvl3.png (XP 600+)
// - Cabeça: head_confident.png (vitality 90-100)
// - Humor: happy
```

### Exemplo 4: Usuário com Decaimento

**Situação**: 400 XP total, mas não usou o app hoje

```typescript
// Cálculo da vitalidade:
const baseVitality = (400 / 500) * 100 = 80%; // Base boa
const appUsagePenalty = 20; // Penalidade por não usar o app
const finalVitality = Math.max(0, 80 - 20) = 60%; // Vitalidade reduzida

// Resultado:
// - Corpo: body_lvl2.png (XP 200-599)
// - Cabeça: head_happy.png (vitality 50-74)
// - Humor: happy
```

---

## 🎮 Integração com PixelBuddy

### Store do PixelBuddy: `src/stores/usePixelBuddyStore.ts`

```typescript
interface PixelBuddyState {
  body: string | null;
  head: string | null;
  clothes: string | null;
  accessory: string | null;
  hat: string | null;
  effect: string | null;
  inventory: Record<string, PixelBuddyItem>;

  setBase: (layer: 'body' | 'head', spritePath: string) => void;
  equipItem: (itemId: string) => void;
  unequipItem: (layer: 'clothes' | 'accessory' | 'hat' | 'effect') => void;
  unlockItem: (item: PixelBuddyItem) => void;
}
```

### Atualização Automática:

```typescript
// Em useGamificationStore.ts
function updatePixelBuddyState(xp: number, vitality: number, mood: string) {
  const pixelBuddyStore = usePixelBuddyStore.getState();
  
  // Atualizar body baseado no XP
  let newBody: string;
  if (xp < 200) {
    newBody = '/Nadr00J/bodies/body_lvl1.png';
  } else if (xp < 600) {
    newBody = '/Nadr00J/bodies/body_lvl2.png';
  } else {
    newBody = '/Nadr00J/bodies/body_lvl3.png';
  }
  
  // Atualizar head baseado na vitalidade
  let newHead: string;
  if (vitality < 25) {
    newHead = '/Nadr00J/heads/head_tired.png';
  } else if (vitality < 50) {
    newHead = '/Nadr00J/heads/head_sad.png';
  } else if (vitality < 75) {
    newHead = '/Nadr00J/heads/head_neutral.png';
  } else if (vitality < 90) {
    newHead = '/Nadr00J/heads/head_happy.png';
  } else {
    newHead = '/Nadr00J/heads/head_confident.png';
  }
  
  // Aplicar mudanças
  if (pixelBuddyStore.body !== newBody) {
    pixelBuddyStore.setBase('body', newBody);
  }
  
  if (pixelBuddyStore.head !== newHead) {
    pixelBuddyStore.setBase('head', newHead);
  }
}
```

---

## 🔧 Debug e Logs

### Logs de Debug:

```typescript
// Em calcVitality()
console.log('[Vitality Debug]', {
  baseVitality: Math.round(baseVitality),
  habitPenalty: Math.round(habitPenalty),
  taskPenalty: Math.round(taskPenalty),
  goalBonus: Math.round(goalBonus),
  appUsagePenalty: Math.round(appUsagePenalty),
  consistencyBonus: Math.round(consistencyBonus),
  finalVitality: Math.round(finalVitality),
  completedHabitsToday: history.filter(item => 
    item.type === 'habit' && 
    item.ts >= todayStart && 
    item.ts <= todayEnd
  ).length,
  completedGoalsToday,
  hasActivityToday,
  activeDays
});
```

### Logs de AddXP:

```typescript
// Em addXp()
console.log('[AddXP Debug]', {
  type,
  tags,
  finalXp,
  newVitality,
  newMood,
  newAspect
});
```

---

## 📚 Referências

### Arquivos Principais:
- `src/stores/useGamificationStore.ts` - Lógica principal de vitalidade
- `src/stores/usePixelBuddyStore.ts` - Estado do PixelBuddy
- `src/components/gamification/PixelBuddyRenderer.tsx` - Renderização
- `src/components/reports/PerformanceReports.tsx` - Relatórios
- `src/config/gamificationConfig.json` - Configuração

### Funções Chave:
- `calcVitality()` - Cálculo da vitalidade
- `updatePixelBuddyState()` - Atualização do avatar
- `getMoodFromVitality()` - Determinação do humor
- `calcAspect()` - Cálculo do aspecto do avatar

---

## 🎯 Conclusão

O sistema de vitalidade do DailyLevel é um mecanismo complexo e bem integrado que:

1. **Reflete o progresso real** do usuário através de múltiplos fatores
2. **Penaliza inconsistência** para incentivar uso regular
3. **Recompensa consistência** com bônus de vitalidade
4. **Transforma dados em narrativa visual** através do PixelBuddy
5. **Adapta-se dinamicamente** às ações do usuário

Este sistema cria uma **experiência gamificada rica** onde o avatar do usuário é uma representação visual direta de seu progresso e dedicação! 🎮✨
