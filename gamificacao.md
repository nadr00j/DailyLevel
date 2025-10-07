# Gamificação — Especificação v0.5

> Sistema de progressão do **DailyLevel** com feedback visual, economia de pontos, loja de recompensas e **painel analítico** (gráficos, histórico e **radar de desempenho por categorias**). Documento pronto para devs, designers e PM.

---

## Índice
1. [Visão Geral](#visão-geral)
2. [Glossário Rápido](#glossário-rápido)
3. [Conceito Central](#conceito-central)
4. [Estados do Personagem (FSM)](#estados-do-personagem-fsm)
5. [Atributos & Categorias (STR/INT/CRE/SOC + BAL)](#atributos--categorias-strintcresoc--bal)
6. [Sistema de Pontos & Economia](#sistema-de-pontos--economia)
7. [Quests & Desafios](#quests--desafios)
8. [Loja de Recompensas](#loja-de-recompensas)
9. [Central de Configuração](#central-de-configuração)
10. [Análises, Gráficos & Histórico](#análises-gráficos--histórico)
11. [Pipeline de Arte (Personagem & Assets)](#pipeline-de-arte-personagem--assets)
12. [Arquitetura Técnica](#arquitetura-técnica)
13. [Telemetria & Métricas](#telemetria--métricas)
14. [Furos, Riscos & Mitigações](#furos-riscos--mitigações)
15. [Testes & Validação](#testes--validação)
16. [Roadmap](#roadmap)
17. [Próximos Passos](#próximos-passos)

---

## Visão Geral
- **PixelBuddy**: avatar-espelho que reage ao comportamento diário.
- **Progressão única**: ações positivas geram **XP**, aumentam **vitalidade** e **coins**; inação reduz vitalidade.
- **Estética**: **pixel-art 64×64**, leve, carismática, com variações por humor e estilo.
- **Camada analítica**: gráficos, histórico e **Radar de Categorias** (% de desempenho com decaimento temporal).
- **Economia**: XP → Coins (moeda interna) para gastar na **Loja** (cosméticos e utilitários não-pagáveis com dinheiro real).

---

## Glossário Rápido
- **XP**: pontos de progressão.
- **Coins**: moeda obtida ao ganhar XP (padrão 1 coin/10 XP).
- **Vitalidade**: indicador 0–100% baseado em XP dos últimos 30 dias versus meta mensal.
- **Streak**: sequência de dias com ≥1 ação; existe streak global e por categoria.
- **Categoria**: cluster de hábitos/tarefas por tema (ex.: Fitness, Programming, Hygiene…).
- **Atributos**: STR, INT, CRE, SOC (30d rolling), definem o aspecto do avatar.

---

## Conceito Central
O **DailyLevel** transforma execução diária em narrativa visual:
- O usuário **vê-se** no PixelBuddy; o avatar melhora (ou adoece) com a disciplina.
- **Sensação de ritmo**: barras, streaks, toasts, animações curtas e recompensas claras.
- **Leveza cognitiva**: 30–60s por sessão para marcar, ver progresso e seguir.

---

## Estados do Personagem (FSM)
**Faixas de vitalidade**

| Vitalidade | Estado Visual | Emoji | Aparência |
|------------|---------------|-------|-----------|
| 0–25%      | 🌱 Iniciante   | 🌱    | Frágil, pálido, postura neutra |
| 26–60%     | 🏃 Engajado   | 🏃    | Passo ativo, sorriso leve |
| 61–90%     | 💪 Forte      | 💪    | Definição, energia visível |
| 91–100%    | 🦸 Épico      | 🦸    | Aura/capa, pose heróica |

**Humor** (happy, neutral, tired, sad) deriva do **streak global** e é uma variação de sprite em cada faixa.

**FSM (Finite State Machine)**
- Entradas: `vitalidade`, `streakGlobal`, `evento` (ganho/perda XP, dia-sem-ação, compra de item, conquista).
- Transições:
  - `onGainXP` → recalcula `xp`, `xp30d`, `vitalidade`, `atributos`, `mood` → anima `bounce`.
  - `onMissedDay` → `vitalidade -= decay`, `mood = tired|sad` (se <40%).
  - `onStreakShield` → ignora `missedDay` uma vez (item da Loja).
  - `onMilestone|Goal` → animação especial + confete + toasts empilhados.

Sprite path:
```
/sprites/buddy/v1/<bal|str|int|cre|soc>/<nivel>_<humor>.png
```

---

## Atributos & Categorias (STR/INT/CRE/SOC + BAL)
**Mapeamento (30 dias rolling):**
- Fitness/saúde/higiene → +1 **STR**
- Estudo/trabalho/lógica → +1 **INT**
- Arte/criação/composição → +1 **CRE**
- Social/família/network → +1 **SOC**
- Outras → apenas **XP**

**Dominância**
- Aspecto do avatar = atributo com maior pontuação quando diferença ≥ 20 vs os outros; caso contrário, **BAL**.

**Streaks por categoria**
- ≥ 7 dias → **+10** bônus no atributo da categoria.
- ≥ 30 dias → desbloqueia **sprite raro** da base.

**Categorias padrão (radar)**
- *Fitness, Hygiene, Drawing, Math, Writing, Design, Programming, Music, Guitar, Social* (podem ser editadas; ver Config).

---

## Sistema de Pontos & Economia
**Valores (×10)**

| Ação                | XP | Coins |
|---------------------|----|-------|
| Hábito marcado      | 10 | 1     |
| Tarefa concluída    | 10 | 1     |
| Milestone concluída | 50 | 5     |
| Meta 100%           | 30 | 3     |

**Derivados**
- **XP30d**: soma de XP dos últimos 30 dias (com janela deslizante).
- **Vitalidade**: `(XP30d ÷ MetaMensal) × 100` — _padrão_ `MetaMensal = 500` (editável).
- **Nível Global**: `floor(XP ÷ 1000)`.
- **Coins**: `floor(XP × coinsPerXp)` — _padrão_ `coinsPerXp=0.1`.

**Multiplicadores (opcionais)**
- Foco do dia (categoria escolhida) → `+20% XP` nessa categoria.
- First-check-in do dia → `+10 XP` flat.
- Anti-grind: `hardCap XP/dia` e `softCap por categoria` (evita farm).

**Decaimento por inatividade**
- Dia sem ações → `vitalidade -= 5%` (configurável). Não afeta **XP** acumulado.

---

## Sistema de Ranks (Rocket-like)

| Tier | Divisões | XP acumulado |
|------|----------|--------------|
| Bronze    | I · II · III | 0-599 |
| Prata     | I · II · III | 600-1199 |
| Ouro      | I · II · III | 1200-1799 |
| Platina   | I · II · III | 1800-2399 |
| Diamante  | I · II · III | 2400-2999 |
| Champion  | I · II · III | 3000-3599 |
| Grand Champ. | I · II · III | 3600-4199 |
| **God Mode** | — | ≥ 4200 |

* Cada divisão exige **200 XP** (total 600 XP por tier).
* Promoção/rebaixamento ocorre automaticamente ao cruzar múltiplos de 200 XP.

### Penalidades ligadas à Vitalidade
* Decaimento inatividade: **-10 %** vitalidade / dia sem ações.
* Quando a vitalidade chega a **0 %**:
  1. ‑50 XP e ‑5 🪙 instantâneos.
  2. Vitalidade volta a 10 % (1 coração).
* Se perder XP suficiente, pode baixar de divisão/tier.

### Feedback de Promoção / Rebaixamento
* Sempre que o XP total cruza um múltiplo de 200 (subida ou descida), o app dispara um **toast**:
  * Promoção → `🏆 Promoção: <Tier> <Div>` (ex.: Ouro II)
  * Rebaixamento → `⚠️ Rebaixado: <Tier> <Div>`
* Lógica: manter `prevDivisionIdx` em memória; comparar com o novo índice após atualizar XP.
* Toast usa classe `bg-secondary text-white border shadow-lg` e duração 3 s.

### Corações (UI)
* 10 corações SVG mostram % de vitalidade (`Math.round(vit/10)` cheios).

Sprite medalhas ficam em `/public/ranks/<tier>_<div>.svg`.

---

## Quests & Desafios
- **Quests diárias** (3 por padrão): aleatórias ponderadas pelas categorias com menor score no radar; recompensas `XP/coins` + chance de item cosmético comum.
- **Semanais**: 3–5 objetivos cumulativos (ex.: 5 treinos, 3 sessões de estudo >25min). Recompensas maiores + badge temporária.
- **Mensais**: foco macro (meta por categoria) que alinha com `target30d` do radar.
- **Reroll** (loja): permite trocar 1 quest diária por dia.

---

## Loja de Recompensas
**Tipos de item**
1) **PixelBuddy Items**: roupas, acessórios, chapéus para o personagem.
2) **Utilitário**: proteção de streak, reroll de quest, boost de XP por categoria (24h), "Dia Zen" (silencia toasts).
3) **Cosmético**: fundos, emotes, trilhas SFX.
4) **Custom**: definido pelo usuário (ex.: recompensa real: café especial, passeio etc.).

**Estrutura**
```ts
interface ShopItem {
  id: string;
  name: string;
  description?: string;
  cost: number;           // coins
  icon?: string;
  kind?: 'pixelbuddy'|'utility'|'cosmetic'|'custom';
  rarity?: 'common'|'rare'|'epic'|'legendary';
  pixelBuddyData?: {
    type: 'clothes'|'accessory'|'hat';
    spritePath: string;
    unlockCondition?: string; // ex: "Reach Gold III"
  };
  payload?: Record<string, any>; // ex.: { boostCategory: 'Fitness', durationH: 24 }
}
```

**Itens PixelBuddy na Loja**
- **Roupas**: Camisetas (50 coins), Moletom (100), Jaqueta (150), Terno (300), Kimono (200), Capa (500)
- **Acessórios**: Óculos (75), Óculos escuros (100), Tapa-olho (150), Máscara (200), Brincos (125)
- **Chapéus**: Boné (50), Touca (75), Cartola (250), Chapéu cowboy (175), Headset (300)

**Raridades e Preços**
- **Common**: 50-100 coins (itens básicos)
- **Rare**: 150-300 coins (itens especiais)
- **Epic**: 400-600 coins (itens únicos)
- **Legendary**: 800+ coins (itens exclusivos)

**Coin sinks recomendados**
- Itens PixelBuddy raros (200–800 coins), Boosts (50–150), Streak shield (100). Preços calibráveis na **Config**.

---

## Central de Configuração
Arquivo único (persistido local + opcional cloud sync) **`gamificationConfig.json`** + tela de edição interna.

```json
{
  "points": {
    "habit": 10,
    "task": 10,
    "milestone": 50,
    "goal100": 30,
    "coinsPerXp": 0.1,
    "vitalityMonthlyTarget": 500,
    "vitalityDecayPerMissedDay": 5
  },
  "shop": [
    { "id": "clothes_tshirt", "name": "Camiseta Básica", "cost": 50, "kind": "pixelbuddy", "rarity": "common", "pixelBuddyData": { "type": "clothes", "spritePath": "clothes_tshirt.png" } },
    { "id": "clothes_hoodie", "name": "Moletom", "cost": 100, "kind": "pixelbuddy", "rarity": "common", "pixelBuddyData": { "type": "clothes", "spritePath": "clothes_hoodie.png" } },
    { "id": "accessory_glasses", "name": "Óculos de Grau", "cost": 75, "kind": "pixelbuddy", "rarity": "common", "pixelBuddyData": { "type": "accessory", "spritePath": "accessory_glasses.png" } },
    { "id": "hat_cap", "name": "Boné", "cost": 50, "kind": "pixelbuddy", "rarity": "common", "pixelBuddyData": { "type": "hat", "spritePath": "hat_cap.png" } },
    { "id": "clothes_cape", "name": "Capa Especial", "cost": 500, "kind": "pixelbuddy", "rarity": "legendary", "pixelBuddyData": { "type": "clothes", "spritePath": "clothes_cape.png", "unlockCondition": "Reach God Mode" } },
    { "id": "streak_shield", "name": "Proteção de Streak (1 dia)", "cost": 100, "kind": "utility" },
    { "id": "xp_boost_fitness", "name": "+20% XP (Fitness, 24h)", "cost": 120, "kind": "utility", "payload": { "boostCategory": "Fitness", "durationH": 24, "multiplier": 1.2 } }
  ],
  "categories": {
    "Fitness":   { "tags": ["fitness", "health"],            "target30d": 200, "weight": 1.0 },
    "Hygiene":   { "tags": ["hygiene"],                       "target30d": 100, "weight": 0.6 },
    "Math":      { "tags": ["math"],                          "target30d": 120, "weight": 0.8 },
    "Programming":{ "tags": ["programming", "code"],         "target30d": 200, "weight": 1.2 },
    "Writing":   { "tags": ["writing"],                       "target30d": 120, "weight": 0.9 },
    "Design":    { "tags": ["design"],                        "target30d": 120, "weight": 0.9 },
    "Drawing":   { "tags": ["drawing"],                       "target30d": 120, "weight": 0.9 },
    "Music":     { "tags": ["music"],                         "target30d": 120, "weight": 0.8 },
    "Guitar":    { "tags": ["guitar"],                        "target30d": 120, "weight": 0.8 },
    "Social":    { "tags": ["social", "friends", "family"], "target30d": 120, "weight": 0.7 }
  },
  "radar": {
    "decayHalfLifeDays": 14,
    "minSamples": 5,
    "includeZeroes": false
  },
  "streaks": { "bonus7": 10, "bonus30": 30 }
}
```

---

## Análises, Gráficos & Histórico
**Estatísticas principais**: XP total, XP30d, Coins, Nível, Vitalidade, Streak global e por categoria, distribuição STR/INT/CRE/SOC.

**Gráficos**
1. **Vitalidade × Tempo** (linha, 30 dias)
2. **XP diário** (barras, 30 dias)
3. **Streaks** (sparklines por categoria)
4. **Radar de Categorias** (percentual)

**Radar — Fórmula**
```
score_c = clamp01( (W_c * XP30d_c^decay / target30d_c) + bonusStreak_c/100 ) × 100
```
- `XP30d_c^decay`: soma do XP da categoria com decaimento exponencial (peso por dia d: `w_d = 0.5^(d/halfLife)`).
- `W_c`: weight da categoria (priorização).
- `target30d_c`: meta mensal por categoria.
- `bonusStreak_c`: +bonus7 (≥7) e +bonus30 (≥30).
- Clamp 0–100.

**Histórico diário** (tabela filtrável): data, ação, XP, coins, tags, +atributo.

---

## Pipeline de Arte (Personagem & Assets)
**Objetivo**: entregar um pacote **coeso**, leve e escalável com sistema de camadas e inventário personalizável.

### 1) Diretrizes de Pixel-art
- **Canvas**: 128×128 px, grid interno **32×32** (blocks de 4px).
- **Paleta**: 12–16 cores máx.; 3 tons por material (luz/meio/sombra).
- **Sombreamento**: soft shading + toque de dithering discreto; evitar banding.
- **Linha**: contorno externo 1px com variação sutil de cor (não preto puro).
- **Animações**: 2–6 frames (idle: 2–3; celebrate: 4–6; tired: 2–3). FPS: 8–12.
- **Export**: PNG com background transparente.
- **Alinhamento**: Todas as camadas devem ter o mesmo tamanho e alinhamento para composição perfeita.

### 2) Arquitetura de Camadas do PixelBuddy

#### Camadas Fixas (Estado do Usuário)
**Corpo (sem cabeça, sem roupa)**
- `body_lvl1.png` - Magro, iniciante (0-600 XP)
- `body_lvl2.png` - Médio, atlético (600-1800 XP) 
- `body_lvl3.png` - Musculoso, lendário (1800+ XP)

**Cabeça (Expressões)**
- `head_neutral.png` - Expressão neutra
- `head_happy.png` - Feliz/Animada (vitalidade >60%)
- `head_tired.png` - Cansada/Sonolenta (vitalidade 25-50%)
- `head_sad.png` - Triste/Derrotada (vitalidade <25%)
- `head_confident.png` - Confiante/Determinado (streak >7 dias)
- `head_evolved.png` - Evoluída, olhos brilhando (God Mode)

**Efeitos (Status Dinâmico)**
- `effect_aura_green.png` - Progresso concluído
- `effect_aura_blue.png` - Foco/concentração
- `effect_aura_red.png` - Abandono/penalidade
- `effect_confetti.png` - Conquista/celebração
- `effect_frozen.png` - Inatividade prolongada

#### Camadas Customizáveis (Inventário)
**Roupas (Torso Overlays)**
- `clothes_tshirt.png` - Camiseta básica
- `clothes_hoodie.png` - Moletom
- `clothes_jacket.png` - Jaqueta
- `clothes_suit.png` - Terno social
- `clothes_regata.png` - Regata Jordan
**Acessórios Faciais**
- `accessory_mask.png` - Máscara simples

**Chapéus/Cabeça**
- `hat_cap.png` - Boné
- `hat_beanie.png` - Touca
- `hat_top_hat.png` - Cartola
- `hat_cowboy.png` - Chapéu de cowboy

### 3) Regras de Combinação
**Ordem de Renderização:**
1. **Body** (fixo por nível)
2. **Head** (expressão atual)
3. **Clothes** (item selecionado, opcional)
4. **Accessory** (um por vez)
5. **Hat** (um por vez)
6. **Effect** (aplicado automaticamente)

**Restrições:**
- Acessórios e chapéus são mutuamente exclusivos (um por vez)
- Roupas podem ser combinadas com qualquer acessório/chapéu
- Efeitos são aplicados automaticamente conforme progresso/estado

### 4) Sistema de Inventário
**Estrutura de Dados:**
```ts
interface PixelBuddyItem {
  id: string;
  name: string;
  description: string;
  type: 'clothes' | 'accessory' | 'hat';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: number; // coins
  unlocked: boolean;
  equipped: boolean;
  spritePath: string;
  unlockCondition?: string; // ex: "Reach Gold III"
}

interface PixelBuddyState {
  body: string; // body_lvl1, body_lvl2, body_lvl3
  head: string; // head_neutral, head_happy, etc.
  clothes: string | null;
  accessory: string | null;
  hat: string | null;
  effect: string | null;
  inventory: PixelBuddyItem[];
}
```

### 5) Geração de Assets
**Opções de Criação:**
- **A)** Manual no **Aseprite** (qualidade garantida)
- **B)** Semiautomático com IA para rascunho + refinamento
- **C)** Kit de templates para variações de cor

**Manifesto de Assets:**
```json
{
  "version": "1.0.0",
  "canvasSize": "128x128",
  "layers": {
    "body": ["body_lvl1", "body_lvl2", "body_lvl3"],
    "head": ["head_neutral", "head_happy", "head_tired", "head_sad", "head_confident", "head_evolved"],
    "effects": ["effect_aura_green", "effect_aura_blue", "effect_aura_red", "effect_confetti", "effect_frozen"],
    "clothes": ["clothes_tshirt", "clothes_hoodie", "clothes_jacket", "clothes_suit", "clothes_kimono", "clothes_cape"],
    "accessories": ["accessory_glasses", "accessory_sunglasses", "accessory_eyepatch", "accessory_mask", "accessory_earring"],
    "hats": ["hat_cap", "hat_beanie", "hat_top_hat", "hat_cowboy", "hat_headset"]
  }
}
```

### 6) Quantidade Inicial
**Fixos:** 14 assets (3 corpos + 6 cabeças + 5 efeitos)
**Customizáveis:** 14 assets (8 roupas + 5 acessórios + 5 chapéus)
**Total:** 28 assets base, combináveis em centenas de variações

### 7) Expansão Futura
- **Skins sazonais** (Halloween, Natal, etc.)
- **Drops especiais** (conquistas raras)
- **Coleções temáticas** (esportes, profissões, etc.)
- **Personalização por foto** (opcional, local-only)

---

## Arquitetura Técnica
**Store (Zustand ou Context + Reducer)**
```ts
type ActionType = 'habit'|'task'|'milestone'|'goal';

interface ShopItem { 
  id:string; 
  name:string; 
  cost:number; 
  description?:string; 
  icon?:string; 
  kind?:'pixelbuddy'|'utility'|'cosmetic'|'custom'; 
  rarity?:'common'|'rare'|'epic'|'legendary';
  pixelBuddyData?:{
    type:'clothes'|'accessory'|'hat';
    spritePath:string;
    unlockCondition?:string;
  };
  payload?:Record<string,any>; 
}

interface PixelBuddyItem {
  id: string;
  name: string;
  description: string;
  type: 'clothes' | 'accessory' | 'hat';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: number;
  unlocked: boolean;
  equipped: boolean;
  spritePath: string;
  unlockCondition?: string;
}

interface PixelBuddyState {
  body: string; // body_lvl1, body_lvl2, body_lvl3
  head: string; // head_neutral, head_happy, etc.
  clothes: string | null;
  accessory: string | null;
  hat: string | null;
  effect: string | null;
  inventory: PixelBuddyItem[];
}

interface CategoryConfig { tags:string[]; target30d:number; weight:number; }
interface RadarConfig { decayHalfLifeDays:number; minSamples:number; includeZeroes:boolean; }
interface GConfig { points:{ habit:number; task:number; milestone:number; goal100:number; coinsPerXp:number; vitalityMonthlyTarget:number; vitalityDecayPerMissedDay:number; }; shop:ShopItem[]; categories:Record<string,CategoryConfig>; radar:RadarConfig; streaks:{ bonus7:number; bonus30:number; }; }
interface HistoryItem { date:string; type:ActionType; xp:number; coins:number; tags?:string[]; category?:string; }

interface GState {
  xp:number; coins:number; xp30d:number; level:number; vitalidade:number; mood:'happy'|'neutral'|'tired'|'sad';
  str:number; int:number; cre:number; soc:number; aspect:'bal'|'str'|'int'|'cre'|'soc';
  streakGlobal:number; streakByCategory:Record<string,number>;
  history:HistoryItem[]; shopItems:ShopItem[]; config:GConfig;
  pixelBuddy: PixelBuddyState;
  addXp:(type:ActionType, tags?:string[])=>void; 
  buyItem:(id:string)=>void; 
  setConfig:(cfg:Partial<GConfig>)=>void;
  equipItem:(itemId:string)=>void;
  unequipItem:(itemType:'clothes'|'accessory'|'hat')=>void;
  unlockItem:(itemId:string)=>void;
}
```

**Algoritmos-chave (resumo)**
- `addXp` → classifica categoria via `tags` → aplica pontos/coins → atualiza `xp30d` (janela 30d) → recalc `vitalidade` → atualiza streaks (global + categoria) → incrementa atributos → atualiza PixelBuddy → loga em `history`.
- `buildRadarData` → soma XP por categoria com **decaimento exponencial** (half-life) → aplica peso, meta e bônus de streak → clampa 0–100.
- `updatePixelBuddy` → determina corpo baseado no XP → determina cabeça baseado na vitalidade/mood → aplica efeitos baseado no estado → renderiza camadas.
- `equipItem` → valida tipo de item → desequipa item do mesmo tipo → equipa novo item → atualiza renderização.
- `buyItem` → valida coins → adiciona item ao inventário → se for PixelBuddy item, desbloqueia automaticamente.

**Anti-dobro de evento**
- Debounce por ação (idempotência): `lastActions` com hash (date+type+habitId/taskId).

**Persistência**
- LocalStorage/IndexedDB + (opcional) sync (account) → prioridade a dados locais com merge por timestamp.

**Acessibilidade**
- Respeitar `prefers-reduced-motion`, `