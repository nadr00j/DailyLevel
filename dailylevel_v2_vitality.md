# DailyLevel — Vitality V2 (Especificação Técnica)

> **Visão geral**  
> A Vitalidade V2 é um **score único e estável (0–100)** que mistura três dimensões sem duplicidade: **Performance 30d**, **Adesão a Hábitos “due” (7d)** e **Recência (7d)** — com **suavização temporal (EMA)** e **histerese de humor**.  
> **Filosofia de game:** _“difícil para iniciantes, frágil no topo”_. Subir de 0→60 exige esforço crescente; manter 90+ é volátil: pequenas falhas causam quedas perceptíveis.

---

## 1) O que muda do V1 para o V2 (changelog)

- **Um modelo único** substitui múltiplas regras: sem penalidade fixa por “não abrir o app hoje” e sem sobreposição de consistência.  
- **Hábitos contam apenas se “due”** (agendados para o dia), normalizados por dia/hábito, **no horizonte de 7 dias**.  
- **Performance 30d é convexa**: progresso no início é mais lento (intencionalmente **duro para iniciantes**).  
- **Fragilidade no topo (90+)**: se você falha em hábitos/recência, o score perde **tração extra**.  
- **Suavização (EMA)** reduz serrilhado e **histerese de humor** evita “pisca-pisca” de sprites.  
- **Relatórios** passam a **reusar exatamente o mesmo cálculo** da Vitalidade (fim da divergência).

---

## 2) Modelo matemático

### 2.1 Componentes (cada um em 0–100)

1. **Performance 30d (perfRaw)**  
   \- Soma de XP dos últimos 30 dias vs alvo mensal (config).  
   \- **Convexo** (expoente \u03B3 > 1) para **dificultar início** e acelerar apenas quando há volume real.  
   \- Fórmula:
   \n
   \t`perfRaw = min(100, ((totalXp30 / xpTarget30d) ^ γ) * 100)`  
   \tPadrão: `xpTarget30d = 500`, `γ = 1.25`

2. **Adesão a Hábitos “due” (habitsAdherence)**  
   \- Janela **7 dias**. Para cada dia, considera apenas hábitos com `schedule[dow] = true` (devidos).  
   \- Uma conclusão por **hábito/dia** no máximo (múltiplas execuções **não** contam extra).  
   \- Fórmula: `habitsAdherence = dueDone / dueTotal * 100` (se `dueTotal = 0` ⇒ 100).

3. **Recência (recency)**  
   \- Dias **ativos** nos últimos 7 (qualquer atividade) → proporção.  
   \- Fórmula: `recency = (activeDays / 7) * 100`

### 2.2 Composição linear + bônus/penas leves

```
vitalityRaw =
  w_perf    * perfRaw +
  w_habits  * habitsAdherence +
  w_recency * recency +
  goalBonus - overduePenalty - topFragility
```

- Pesos padrão: `w_perf = 0.50`, `w_habits = 0.30`, `w_recency = 0.20`  
- **Bônus por metas**: `goalBonus = min(goalBonusPerDay, goalsToday * 5)`; padrão `goalBonusPerDay = 10`  
- **Tarefas vencidas**: `overduePenalty = min(overdueTaskPenaltyMax, overdueTasksCount * 2)`; padrão `overdueTaskPenaltyMax = 15`

### 2.3 Fragilidade no topo (90+)

Quando o **score anterior** (`prevVitality`) está em **90+**, qualquer falha tem **impacto adicional**:

```
missFactor = 0.6 * (1 - recency/100) + 0.4 * (1 - habitsAdherence/100)
topFragility = (prevVitality >= 90)
  ? λ * ((prevVitality - 90) / 10) * missFactor
  : 0
```

- `λ` (lambda) padrão: **6.0**  
- Intuição: acima de 90, a “aderência do chão” diminui; se você relaxa, escorrega.  
- Cap natural: se `prevVitality=95` e `missFactor≈0.5`, `topFragility≈(6 * 0.5 * 0.5) = 1.5` pts extras de queda naquele ciclo, além do efeito normal.

### 2.4 Suavização temporal (EMA)

```
vitality = EMA(prevVitality, clamp(vitalityRaw, 0, 100), α)
EMA(a, x, α) = α * a + (1 - α) * x     // α em [0..1]
```

- Padrão `α = 0.7` (70% passado, 30% presente).
- Mantém “peso histórico” e evita serrilhado; quedas/saltos ainda existem — só não são abruptos.


---

## 3) Estados de Humor (com histerese)

Faixas base e **margem (h)** para evitar troca frequente de sprite:

- Limiares padrão: `tired <25`, `sad <50`, `neutral <75`, `happy <90`, `confident ≥96`  
- Histerese: `h = 4` pontos

**Regra:** para **subir** um nível, ultrapasse (limiar + h). Para **descer**, caia abaixo de (limiar - h).

```ts
export type Mood = 'tired'|'sad'|'neutral'|'happy'|'confident';
```

---

## 4) Corações (UI)

- **Mapeamento:** `hearts = ceil(vitality / 10)` ⇒ 0–10 corações.
- **Top fragility UX:** ao cair de `≥90` para `<90`, exibir micro animação de “coração se partindo” (feedback claro).
- **Tooltips:** mostrar **breakdown** (% por componente) no hover.

---

## 5) Configuração (JSON)

```json
{
  "points": {
    "habit": 10,
    "task": 10,
    "milestone": 50,
    "goal": 30,
    "coinsPerXp": 0.1,
    "vitalityMonthlyTarget": 500
  },
  "vitalityV2": {
    "weights": { "perf": 0.5, "habits": 0.3, "recency": 0.2 },
    "caps": { "goalBonusPerDay": 10, "overdueTaskPenaltyMax": 15 },
    "smoothingAlpha": 0.7,
    "gammaPerf": 1.25,
    "topFragilityLambda": 6.0,
    "mood": {
      "thresholds": { "tired": 25, "sad": 50, "neutral": 75, "happy": 90, "confident": 96 },
      "hysteresis": 4
    }
  }
}
```

---

## 6) Implementação (TypeScript)

### 6.1 Tipos

```ts
export type HistoryItem = {
  ts: number;
  type: 'habit' | 'task' | 'goal' | 'xp';
  xp?: number;
  id?: string;
  meta?: Record<string, any>;
};

export type Habit = {
  id: string;
  schedule: { 0?: boolean; 1?: boolean; 2?: boolean; 3?: boolean; 4?: boolean; 5?: boolean; 6?: boolean; };
};

export type VitalityConfigV2 = {
  xpTarget30d: number;
  weights: { perf: number; habits: number; recency: number; };
  caps: { goalBonusPerDay: number; overdueTaskPenaltyMax: number; };
  smoothingAlpha: number;
  gammaPerf: number;
  topFragilityLambda: number;
  mood: {
    thresholds: { tired: number; sad: number; neutral: number; happy: number; confident: number; };
    hysteresis: number;
  };
};
```

### 6.2 Núcleo (função pura)

```ts
export function computeVitalityV2(
  history: HistoryItem[],
  habits: Habit[],
  now: number,
  prevVitality?: number,
  overdueTasksCount?: number,
  cfg?: Partial<VitalityConfigV2>
) {
  const today = new Date(now); today.setHours(0,0,0,0);
  const dayStart = today.getTime();
  const dayEnd = dayStart + 24*60*60*1000 - 1;

  const C: VitalityConfigV2 = {
    xpTarget30d: cfg?.xpTarget30d ?? 500,
    weights: cfg?.weights ?? { perf: 0.5, habits: 0.3, recency: 0.2 },
    caps: cfg?.caps ?? { goalBonusPerDay: 10, overdueTaskPenaltyMax: 15 },
    smoothingAlpha: cfg?.smoothingAlpha ?? 0.7,
    gammaPerf: cfg?.gammaPerf ?? 1.25,
    topFragilityLambda: cfg?.topFragilityLambda ?? 6.0,
    mood: cfg?.mood ?? {
      thresholds: { tired: 25, sad: 50, neutral: 75, happy: 90, confident: 96 },
      hysteresis: 4
    }
  };

  // --- Performance 30d ---
  const start30 = dayStart - 29*24*60*60*1000;
  const h30 = history.filter(h => h.ts >= start30 && h.ts <= dayEnd);
  const totalXp30 = h30.reduce((s, it) => s + (it.xp ?? 0), 0);
  const ratio = Math.max(0, Math.min(1, totalXp30 / C.xpTarget30d));
  const perfRaw = Math.min(100, Math.pow(ratio, C.gammaPerf) * 100);

  // --- Hábitos due (7d) ---
  const days = Array.from({length:7}, (_,i)=> {
    const d = new Date(dayStart - i*24*60*60*1000);
    d.setHours(0,0,0,0);
    return d;
  });

  const isDue = (habit: Habit, dt: Date) => !!habit.schedule[dt.getDay() as 0|1|2|3|4|5|6];

  let dueTotal = 0, doneTotal = 0;
  for (const d of days) {
    const s = d.getTime(); const e = s + 24*60*60*1000 - 1;
    const dueToday = habits.filter(h => isDue(h, d));
    if (dueToday.length === 0) continue;
    dueTotal += dueToday.length;

    const completions = new Set(
      history.filter(h=> h.type==='habit' && h.ts>=s && h.ts<=e).map(h=> h.id ?? '')
    );
    doneTotal += dueToday.filter(h=> completions.has(h.id)).length;
  }
  const habitsAdherence = dueTotal === 0 ? 100 : (doneTotal / dueTotal) * 100;

  // --- Recência (7d) ---
  let activeDays = 0;
  for (const d of days) {
    const s = d.getTime(); const e = s + 24*60*60*1000 - 1;
    if (history.some(h=> h.ts>=s && h.ts<=e)) activeDays++;
  }
  const recency = (activeDays / 7) * 100;

  // --- Bônus / Penalidades leves ---
  const goalsToday = history.filter(h=> h.type==='goal' && h.ts>=dayStart && h.ts<=dayEnd).length;
  const goalBonus = Math.min(C.caps.goalBonusPerDay, goalsToday * 5);
  const overduePenalty = Math.min(C.caps.overdueTaskPenaltyMax, Math.max(0, overdueTasksCount ?? 0) * 2);

  // --- Fragilidade topo (90+) ---
  const missFactor = 0.6 * (1 - recency/100) + 0.4 * (1 - habitsAdherence/100);
  const topFragility =
    (typeof prevVitality === 'number' && prevVitality >= 90)
      ? C.topFragilityLambda * ((prevVitality - 90) / 10) * missFactor
      : 0;

  // --- Composição ---
  const raw =
    C.weights.perf    * perfRaw +
    C.weights.habits  * habitsAdherence +
    C.weights.recency * recency +
    goalBonus - overduePenalty - topFragility;

  const clamped = Math.max(0, Math.min(100, raw));
  const alpha = Math.max(0, Math.min(1, C.smoothingAlpha));
  const vitality = (typeof prevVitality === 'number')
    ? (alpha * prevVitality + (1 - alpha) * clamped)
    : clamped;

  return {
    vitality: Math.round(vitality),
    breakdown: {
      perfRaw: Math.round(perfRaw),
      habitsAdherence: Math.round(habitsAdherence),
      recency: Math.round(recency),
      goalBonus,
      overduePenalty,
      topFragility: Math.round(topFragility * 10) / 10,
      activeDays,
      doneTotal, dueTotal,
      totalXp30
    }
  };
}
```

### 6.3 Humor com histerese

```ts
export type Mood = 'tired'|'sad'|'neutral'|'happy'|'confident';

export function moodFromVitalityHysteresis(
  v: number,
  prevMood: Mood | null,
  t = { tired:25, sad:50, neutral:75, happy:90, confident:96 },
  h = 4
): Mood {
  const order: Mood[] = ['tired','sad','neutral','happy','confident'];
  const idx = (m: Mood)=> order.indexOf(m);

  const target = (v:number): Mood => {
    if (v < t.tired) return 'tired';
    if (v < t.sad) return 'sad';
    if (v < t.neutral) return 'neutral';
    if (v < t.happy) return 'happy';
    return 'confident';
  };

  if (!prevMood) return target(v);
  const upBarrier = (m: Mood) => {
    if (m==='tired') return t.sad + h;
    if (m==='sad') return t.neutral + h;
    if (m==='neutral') return t.happy + h;
    if (m==='happy') return t.confident + h;
    return Infinity;
  };
  const downBarrier = (m: Mood) => {
    if (m==='confident') return t.happy - h;
    if (m==='happy') return t.neutral - h;
    if (m==='neutral') return t.sad - h;
    if (m==='sad') return t.tired - h;
    return -Infinity;
  };

  if (v >= upBarrier(prevMood)) return order[Math.min(idx(prevMood)+1, order.length-1)];
  if (v <= downBarrier(prevMood)) return order[Math.max(idx(prevMood)-1, 0)];
  return prevMood;
}
```

### 6.4 Integração no store

```ts
// useGamificationStore.ts (na atualização de history/habits/tasks)
const { vitality: v, breakdown } = computeVitalityV2(
  state.history,
  state.habits,
  Date.now(),
  state.vitality,
  state.overdueTasksCount,
  {
    xpTarget30d: cfg.points.vitalityMonthlyTarget,
    weights: cfg.vitalityV2?.weights,
    caps: cfg.vitalityV2?.caps,
    smoothingAlpha: cfg.vitalityV2?.smoothingAlpha,
    gammaPerf: cfg.vitalityV2?.gammaPerf,
    topFragilityLambda: cfg.vitalityV2?.topFragilityLambda,
    mood: cfg.vitalityV2?.mood
  }
);

const newMood = moodFromVitalityHysteresis(v, state.mood as any, cfg.vitalityV2?.mood?.thresholds, cfg.vitalityV2?.mood?.hysteresis);

updatePixelBuddyState(state.totalXp, v, newMood);
set({ vitality: v, mood: newMood, vitalityDebug: breakdown });
```

### 6.5 Relatórios (usar o mesmo core)

```ts
// Em PerformanceReports.tsx
const { vitality, breakdown } = useMemo(() => {
  return computeVitalityV2(
    filteredHistory,            // já no período/escopo desejado? (ou passe o history global)
    habits,
    Date.now(),
    lastVitalityInView,         // opcional p/ EMA local
    overdueTasksCount,
    { xpTarget30d: config.points.vitalityMonthlyTarget }
  );
}, [filteredHistory, habits, overdueTasksCount, config.points.vitalityMonthlyTarget]);
```

> **Observação**: Se quiser exibir “Progresso do Período” (dia/semana/mês), apresente como **métrica separada** do card de Vitalidade para evitar ambiguidade.

---

## 7) Regras de Render (PixelBuddy)

- **Corpo** continua por **XP total** (progressão de longo prazo).  
- **Efeitos/pose** reagem à Vitalidade:
  - `<25`: effect `low_battery` (sweat, idle mais lento)
  - `25–49`: `none`, postura levemente curvada
  - `50–74`: `neutral_breath`
  - `75–89`: `sparkles_soft`
  - `≥90`: `aura_glow` + idle heróico
- **Cabeça** usa `moodFromVitalityHysteresis`.

---

## 8) Logs e Debug

```ts
console.log('[Vitality V2]', {
  perfRaw,
  habitsAdherence,
  recency,
  goalBonus,
  overduePenalty,
  topFragility,
  vitality,
  activeDays,
  dueTotal, doneTotal,
  totalXp30
});
```

---

## 9) Cenários (exemplos numéricos)

### 9.1 Iniciante “duro”
- `totalXp30 = 50` → ratio=0.10 → perfRaw=(0.10^1.25)*100 ≈ **5.6**
- Hábitos due/7d: `dueTotal=10`, `doneTotal=5` → **50%**
- Recência: `activeDays=5/7` → **71%**
- Composição: `0.5*5.6 + 0.3*50 + 0.2*71 ≈ 2.8 + 15 + 14.2 = 32.0`
- Sem bônus/penas. EMA com `prev=35`: `0.7*35 + 0.3*32 = 34.1`
- **Resultado:** ~**34** (difícil subir — intenção de design).

### 9.2 Engajado estável
- `totalXp30=300` → ratio=0.6 → perfRaw≈(0.6^1.25)*100≈ **52.3**
- Hábitos `90%`, Recência `7/7=100%`
- Score: `0.5*52.3 + 0.3*90 + 0.2*100 = 26.2 + 27 + 20 = 73.2`
- **Resultado:** ~**73** (solid).

### 9.3 Topo frágil (prev=95), 2 dias off e hábitos 60%
- perfRaw alto, mas `recency≈71`, `habits≈60`
- `missFactor = 0.6*(1-0.71) + 0.4*(1-0.60) ≈ 0.6*0.29 + 0.4*0.40 = 0.174 + 0.16 = 0.334`
- `topFragility = 6 * ((95-90)/10) * 0.334 ≈ 6 * 0.5 * 0.334 ≈ 1.0–1.1` ponto extra de queda
- Com a composição base, cai para a faixa **86–89** após EMA.
- **Resultado:** perceptível “escorregão” no topo — fácil de descer, difícil de manter.

---

## 10) Migração e Garantias

- **Remover** do V1: `appUsagePenalty` e `consistencyBonus` (duplicidade).  
- **Habits due**: garantir `schedule` no HabitStore e **id** estável por hábito.  
- **Timezone único** (`America/Sao_Paulo`) para fechar dias corretamente.  
- **Relatórios**: trocar cálculo próprio pela chamada ao **core V2**.

---

## 11) Tuning (balanceamento)

- **Mais duro pra iniciante:** aumente `gammaPerf` (1.35–1.5) **ou** suba `w_perf`.  
- **Mais frágil no topo:** suba `topFragilityLambda` (7–9) **ou** aumente peso de `habits/recency`.  
- **Menos serrilhado:** aumente `smoothingAlpha` (0.8–0.9).  
- **Mais responsivo:** reduza `smoothingAlpha` (0.5–0.6).

> **Recomendação inicial:** `γ=1.25`, `λ=6.0`, `α=0.7`. Ajustar após 1–2 semanas de telemetria (média, p95, p99 de vitalidade, distribuição de faixas e tempo em 90+).

---

## 12) Testes mínimos

- [ ] Sem hábitos due → `habitsAdherence=100` (não penaliza).  
- [ ] `prevVitality<90` → `topFragility=0`.  
- [ ] `prevVitality≥90` & `recency=habits=100` → `topFragility=0`.  
- [ ] `prevVitality≥90` & `recency=0` → `topFragility` máximo esperado.  
- [ ] Histerese: oscilar +/-3 pts ao redor de um limiar **não** troca humor.

---

## 13) Anexos de Código (opcional)

- `vitalityV2.ts` (core)  
- `moodHysteresis.ts`  
- Patches para `useGamificationStore.ts` e `PerformanceReports.tsx`

---

## 14) Conclusão

Vitalidade V2 entrega **clareza** e **sensação de jogo**: início **árduo**, topo **frágil**, progresso **merecido**. Ao mesmo tempo, remove ruído e duplicidade, unifica telas e torna o comportamento **previsível**.  
A partir daqui, o ajuste fino é **telemetria + tuning**. Onwards.
