# DailyLevel — Product Requirements Document (PRD)

**Versão:** v0.9 (MVP)\
**Plataforma:** PWA (iOS/Android/Desktop)\
**Estado:** Em construção (escopo fechado para MVP)\
**Referência estética:** HabitKit (dark-first, cards arredondados, heatmap), sem copiar marca/identidade.

---

## 1) Resumo executivo

O **DailyLevel** é um PWA offline‑first para **execução diária** com três áreas: **Hábitos** (check‑in e heatmap), **Tarefas** (to‑do organizado por buckets: Hoje/Semana/Depois) e **Metas** (milestones com barra de progresso). O objetivo é reduzir fricção: 30–60s por sessão para marcar hábitos, concluir/organizar tarefas e acompanhar o progresso das metas.

**Fora do escopo do MVP:** notificações, widgets nativos, sync multi‑dispositivo.

---

## 2) Objetivos & Métricas

**Objetivos**

1. Capturar e concluir ações do dia com o menor atrito possível.
2. Dar visibilidade simples do progresso (streak/heatmap e barras).
3. Operar 100% offline com dados armazenados no dispositivo.

**KPIs (MVP)**

- **Tempo até primeira ação** < 5s após abrir o app (P95).
- **TTI (time‑to‑interactive)** < 1.2s no iPhone médio (cacheado).
- **Ações por sessão**: ≥ 2 (check de hábito ou conclusão de tarefa).
- **Crash/erro bloqueante**: 0 conhecidos.

---

## 3) Personas

- **Executor Solo (Nadr00J)**: usa o app para organizar vida diária (hábitos/ tarefas) e dar direção às metas. Valoriza velocidade, estética e controle local dos dados. Usa iPhone e também desktop.

---

## 4) Princípios de Produto

- **Fricção Zero:** 1 toque para marcar uma coisa feita.
- **Clareza Visual:** dark-first, cards densos porém legíveis, microtipografia.
- **Offline‑first:** tudo funciona sem internet; sync é opcional no futuro.
- **Sem Perfis Complexos:** defaults inteligentes; configurações mínimas.

---

## 5) Escopo Funcional (MVP)

### 5.1 Home (Hoje)

Painel compacto tipo “widget in‑app”. Mostra:

- **Hábitos de hoje** (até 4 em destaque) com botão de check no card.
- **Tarefas (Hoje)** (até 5 primeiras), checkbox e swipe para mover.
- **Meta em foco** (opcional, a última editada) com barra de progresso.

### 5.2 Hábitos

- Lista de hábitos ativos, cada card com título, descrição curta, ícone sutil, **heatmap** de presença (7×N), botão circular **“check hoje”**.
- **Streak** calculado por data local; visual “🔥 12”.
- Frequência: `diário`, `x5` (dias úteis) ou `custom (dias da semana)`.
- **Skip semanal** (1 por semana) – **desligado por padrão no MVP**.
- Histórico visível por mês (scroll horizontal do heatmap). Sem calendário pesado.

### 5.3 Tarefas

- Buckets: **Hoje · Semana · Depois** (chips de filtro no topo).
- Itens com: título, nota opcional, tags, prioridade (1/2/3), `done`.
- **Ações:** tap no checkbox, **swipe** para mover bucket, excluir.
- **Captura rápida**: input “Adicionar tarefa…” no topo (Enter/Salvar).
- **Reordenação** por arrastar dentro do bucket.

### 5.4 Metas

- Cards com título, descrição breve, deadline opcional.
- **Milestones** (checklist) influenciam `progress` (% concluído).
- Tarefas podem referenciar `goalId` (navegação cruzada simples).

### 5.5 Export/Import (backup local)

- **Exportar JSON** (download) contendo `tasks/habits/goals/meta`.
- **Importar JSON**: mescla por `id`; conflitos resolvidos por **mais recente (**``**)**.

### 5.6 Preferências mínimas

- Tema: **Dark** (padrão); Light (V0.2).
- Fuso/Calendário: usa fuso do sistema. Exibe datas em `pt‑BR`.

---

## 6) Fora do escopo (MVP)

- Notificações (push/local), widgets nativos (iOS/Android), Live Activities.
- Sync multi-dispositivo/conta/login.
- Relatórios avançados e gráficos históricos.
- Colaboração/equipe.

---

## 7) Regras de Negócio

### 7.1 Datas e timezone

- Todas as marcações usam **data local** do device. Formato ISO `YYYY‑MM‑DD` para chaves do heatmap/histórico.
- Mudança de fuso: ao abrir o app, recalcular “hoje” e **não retroagir streak** (streak só cresce em marcações válidas).

### 7.2 Streak

- `streak` incrementa se **hoje** marcado e **ontem** era válido (marca presente) – incluindo `skip` quando ativo.
- Remover a marcação de hoje **decrementa** o streak se quebrar continuidade.

### 7.3 Heatmap

- Níveis de intensidade: 0 (vazio), 1, 2, 3 (p. ex. múltiplos checks por dia podem subir intensidade – **MVP usa binário** 0/1).

### 7.4 Buckets de tarefas

- `Hoje`: ações para o dia.
- `Semana`: backlog de curto prazo (7–10 dias).
- `Depois`: médio/longo prazo.
- Mover item entre buckets **não** altera `due` automaticamente.

### 7.5 Metas

- `progress = (milestonesDone / totalMilestones) * 100` arredondado.
- Excluir meta desassocia `goalId` de tarefas relacionadas (não apaga tarefas).

### 7.6 Export/Import

- **Mesclagem por id**; se ids iguais e campos diferentes, prevalece objeto com maior `ts` (timestamp). Mantém integridade de referências (`goalId`).

---

## 8) UX/UI

### 8.1 Design tokens (Tailwind)

- **Cores**
  - Fundo: `ink.900 #0B0B0F`, superfícies: `ink.800 #111319`, borda: `ink.700 #1A1F2B`.
  - Texto: base `#EDEFF6`, dim `#A9B0C3`.
  - Tons por seção:
    - **green**: `#6EF3A3`, `#00D17A`, `#00C26E`
    - **purple**: `#C4A3FF`, `#8B6CFF`, `#6E54FF`
    - **orange**: `#FFC069`, `#FF9A5C`, `#FF7A45`
- **Radii**: cards `22–24px`.
- **Tipografia**: 16–18px corpo; 13–14px subtítulo.
- **Ícones**: mono/duo‑tone discretos, 24–28px, dentro de quadrado 36–40px.
- **Micro‑interações**: animações 120–160ms, easing out, sombras internas sutis.

### 8.2 Navegação

- **Tab bar** inferior: **Tarefas · Hábitos · Metas**.
- **Home default = PaneI Hoje** (dentro de Tarefas ou rota `/`).
- Ações de edição via **sheet** (sem modal em tela cheia).

### 8.3 Acessibilidade

- Contraste AA, alvos de toque ≥ 44×44, foco visível, labels semânticos.

---

## 9) Modelos de Dados (TypeScript)

```ts
export type ID = string; // uuid
export type ISODate = string; // 'YYYY-MM-DD'

export type Task = {
  id: ID; title: string; note?: string;
  bucket: 'today'|'week'|'later';
  due?: ISODate; priority?: 1|2|3; tags?: string[];
  done: boolean; order?: number; goalId?: ID; ts: number;
};

export type Habit = {
  id: ID; name: string; description?: string; icon?: string;
  schedule: 'daily'|'x5'|'custom'; customDays?: number[]; // 0=Dom..6=Sáb
  history: Record<ISODate, boolean>; // MVP binário
  streak: number; lastCheck?: ISODate; ts: number;
  skipEnabled?: boolean; skipsLeft?: number; // desativado por padrão
};

export type Goal = {
  id: ID; title: string; desc?: string; targetDate?: ISODate;
  progress: number; milestones: {id: ID; title: string; done: boolean}[];
  ts: number;
};

export type Meta = {
  lastSkipWeekISO?: ISODate; // para reposição semanal de skip
  primaryGoalId?: ID;
  appVersion: string;
};
```

### 9.1 Armazenamento (IndexedDB via localforage)

- Chaves: `tasks:v1`, `habits:v1`, `goals:v1`, `meta:v1`.
- **Migração**: se `meta.appVersion` mudar, aplicar migradores incrementais (ex.: `v1→v2`).

### 9.2 Export/Import JSON (exemplo)

```json
{
  "version": "1",
  "exportedAt": 1734470400000,
  "tasks": [{
    "id": "t_01", "title": "Treino A", "bucket": "today",
    "done": false, "ts": 1734460000000
  }],
  "habits": [{
    "id": "h_01", "name": "Beber água", "schedule": "daily",
    "streak": 12, "history": {"2025-08-16": true, "2025-08-17": true},
    "ts": 1734460000000
  }],
  "goals": [{
    "id": "g_01", "title": "Subir 3kg de massa magra",
    "progress": 33,
    "milestones": [
      {"id": "m_1", "title": "Ajustar dieta", "done": true},
      {"id": "m_2", "title": "Treinar 5x/semana", "done": false}
    ],
    "ts": 1734460000000
  }],
  "meta": {"appVersion": "1.0.0"}
}
```

---

## 10) Arquitetura & Stack

- **Next.js 14 (App Router)** + **React 18**
- **TailwindCSS** (tokens acima)
- **next-pwa** (service worker + manifest)
- **localforage** (IndexedDB); **date-fns** (datas)

### 10.1 Estrutura de pastas (proposta)

```
src/
  app/
    layout.tsx
    page.tsx                 // Home = Painel Hoje
    tasks/page.tsx
    habits/page.tsx
    goals/page.tsx
    settings/page.tsx
  components/
    Card.tsx Heatmap.tsx HabitCard.tsx TaskItem.tsx GoalCard.tsx
    Section.tsx TabBar.tsx FAB.tsx Sheet.tsx
  hooks/
    useTasks.ts useHabits.ts useGoals.ts useLocalStore.ts
  lib/
    db.ts date.ts ids.ts migrations.ts
  styles/
    globals.css tailwind.css
public/
  manifest.json icons/
```

### 10.2 PWA

**manifest.json** (MVP)

```json
{
  "name": "DailyLevel",
  "short_name": "DailyLevel",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0B0B0F",
  "theme_color": "#0B0B0F",
  "icons": [
    {"src":"/icons/icon-192.png","sizes":"192x192","type":"image/png"},
    {"src":"/icons/icon-512.png","sizes":"512x512","type":"image/png"}
  ]
}
```

**next.config.mjs** (esqueleto)

```js
import withPWA from 'next-pwa';
export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
})();
```

**Cache strategy** (next-pwa runtimeCaching)

- Estático (JS/CSS/fonts/img): **CacheFirst** com versionamento.
- Rotas HTML: **NetworkFirst** (fallback cache offline).
- Imagens remotas (se houver): **StaleWhileRevalidate**.
- Fallback offline: `/offline` (mostrar mensagem e link para Home).

---

## 11) Critérios de Aceite (DoD)

### 11.1 Home

- Renderiza os 3 blocos (hábitos hoje, tarefas hoje, meta em foco).
- Tap em check marca hábito de hoje e atualiza heatmap/streak em <100ms.
- Checkbox de tarefa altera estado e move item para seção “Concluídas do dia” (opcional).

### 11.2 Hábitos

- Criar/editar/excluir hábito via sheet; escolher frequência.
- Heatmap mostra o mês corrente; swipe horizontal troca mês.
- Streak atualiza corretamente ao marcar/desmarcar hoje.

### 11.3 Tarefas

- Criar tarefa por input rápido; reordenar via arrastar.
- Swipe → mover de bucket e excluir.
- Filtro por chip (Hoje/Semana/Depois) persistente na sessão.

### 11.4 Metas

- Criar meta, adicionar/remover milestones, barra de progresso reativa.
- Vincular tarefa a `goalId` e navegar para a meta a partir da tarefa.

### 11.5 Export/Import

- Export gera arquivo `.json` baixável.
- Import mescla por id, com preferência por maior `ts`, sem erro silencioso.

### 11.6 Offline

- App abre e opera sem internet: criar/editar/checar tudo.

---

## 12) Test Plan (QA)

- **Funcional:** criação/edição/remoção; streak/heatmap; buckets; milestones.
- **Offline:** habilitar Modo Avião; repetir fluxo completo; recarregar páginas.
- **Instalação iOS:** Add to Home; abrir em standalone; checar manifest (ícone/splash).
- **Performance:** Lighthouse PWA ≥ 90; TTI < 1.2s cacheado.
- **A11y:** foco via teclado, labels ARIA, contraste.
- **Dados:** export/import com 50+ itens.

---

## 13) Riscos & Mitigações

- **Purge de storage pelo iOS** após longo tempo sem uso → Mitigar com **export rápido** em Configurações.
- **Flickers de SW no dev** → permitir desabilitar PWA no `next.config` em `development`.
- **Gestos de swipe inconsistentes no iOS** → fallback para menu de 3 pontos.

---

## 14) Roadmap

- **V0 (MVP):** Home, Hábitos, Tarefas, Metas, Export/Import, Offline.
- **V0.1:** filtros/tags, busca, tema escuro refinado, swipe polido.
- **V0.2:** tema claro, resumos semanais.
- **V1:** sync (conta), Web Push, ponte Notion (one‑way), relatório semanal.

---

## 15) Backlog (Epics → histórias)

**E1 – Fundações PWA**

-

**E2 – Hábitos**

-

**E3 – Tarefas**

-

**E4 – Metas**

-

**E5 – Export/Import**

-

**E6 – Polimento**

-

---

## 16) Conteúdo & Microcopy (PT‑BR)

- Placeholders: “Adicionar tarefa…”, “Hoje”, “Semana”, “Depois”.
- Estados vazios: “Sem hábitos por hoje”, “Nada em Hoje — puxe da Semana”.
- Confirmações curtas: “Feito”, “Movido para Semana”.

---

## 17) Segurança & Privacidade

- Dados **locais** por padrão; sem coleta de analytics de terceiros no MVP.
- Export explícito pelo usuário. Sem uploads automáticos.

---

## 18) Anexos

### 18.1 Fluxos principais

1. **Marcar hábito:** Home → tap no botão do card → feedback tátil/visual → streak+heatmap.
2. **Capturar tarefa:** Tarefas/Hoje → input → Enter → item no topo.
3. **Mover tarefa:** swipe → escolher bucket → snackbar de desfazer (opcional).
4. **Meta:** criar → adicionar 3 milestones → acompanhar progresso na Home.

### 18.2 Gestos e Estados

- Tap, long‑press (editar), swipe horizontal em listas, scroll elástico sutil.

### 18.3 Especificação Heatmap (MVP)

- Cada dia = 1 dot (6–8px, radius 3–4).
- 7 colunas (Dom–Sáb) × semanas roláveis.
- Cores: tom da seção com 3 níveis (MVP usa 0/1).

---

## 19) Decisões Tomadas

- PWA em Next 14, offline‑first, **sem notificações/widgets/sync** no MVP.
- Home como painel “widget‑like”.
- Buckets substituem calendário de tarefas.

## 20) Questões em Aberto

- Ativar **skip semanal** já no MVP? (atualmente **não**)
- Incluir “Concluídas do dia” como seção colapsável em Tarefas? (provável **sim**)
- Escolha de ícones (pack) – sugerido `lucide`/`tabler` (licenças permissivas).

---

> **Pronto para implementação.** Este PRD descreve o escopo fechado do MVP, critérios de aceite e o desenho técnico suficiente para iniciar o desenvolvimento no Cursor/Lovable e evoluir com segurança.

