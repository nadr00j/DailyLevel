# DailyLevel — Vitality V2.1 (Event‑Driven + Sync‑on‑Open)

> **Resumo executivo**  
> - **Uma única Vitalidade** (0–100) — usada nos corações do PixelBuddy e em relatórios (com *breakdown*), sem “vitalidade de performance” paralela.  
> - **Recalcula só em três momentos:** (A) **abrir o app** (fecha dias pendentes e aplica penalidades uma única vez), (B) **eventos de jogo** (habits/tasks/goals/xp/coins), (C) **cron diário opcional**.  
> - **Penalidade de hábito/tarefa** é **aplicada uma vez por dia devido**, com **ledger idempotente** e **cap diário**; hábitos pouco frequentes doem mais (**escassez**).  
> - **Topo frágil (90+)** e **ganhos capados** mantêm a sensação “**difícil de ganhar, fácil de perder**”.  
> - **Sem recomputar no load**: o cliente só sincroniza com o estado oficial retornado pelo servidor/RPC.

---

## 1) Por que V2.1? (diferenças chave vs V1)
- Remove duplicidades (penalidade “não abriu hoje” + consistência separada).  
- Substitui janelas fixas confusas por **fechamento diário + ledger** (idempotente).  
- **Vitalidade única** em todas as telas; relatórios mostram **o mesmo número** + *breakdown*.  
- Hábito é avaliado **apenas nos dias devidos** (segundo `RRULE/schedule`), máximo **1 conclusão por hábito/dia**.  
- Sincronismo claro: **onOpen**, **onEvent**, **cron** (opcional).

---

## 2) Modelo conceitual (componentes do score)
**Vitality (0–100)** é atualizada por **eventos** e **fechamentos diários**:
- **Penalidades (dominantes):**  
  - *Miss de hábito devido* (não concluído no dia devido).  
  - *Tarefa atrasada por dia* (enquanto não concluída).  
  - *Fragilidade no topo* (se Vitalidade anterior ≥ 90).  
- **Ganhos (capados):**  
  - Conclusão de hábito devido (pequeno).  
  - Conclusão de meta (moderado).  
- **Suavização opcional (EMA)** apenas para UI; o **valor oficial** é persistido a cada aplicação.

**Filosofia:** *barra de vida* que sobe em passos pequenos, perde em blocos claros e **nunca** depende de o app ficar aberto.

---

## 3) Dados (Supabase — fonte da verdade)

### 3.1 Tabelas
```sql
-- Estado agregado do usuário
create table if not exists user_vitality_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  value numeric(5,2) not null default 50,         -- 0..100
  version bigint not null default 0,
  last_close_date date not null default (current_date - interval '1 day')::date,
  prev_mood text,                                 -- 'tired'|'sad'|'neutral'|'happy'|'confident'
  updated_at timestamptz not null default now()
);

-- Hábitos
create table if not exists habit (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'active',          -- active|paused|archived
  rrule text not null,                            -- ex: FREQ=WEEKLY;BYDAY=MO,WE,FR  | FREQ=DAILY | FREQ=MONTHLY;BYMONTHDAY=10
  created_at date not null default current_date
);

-- Conclusões (1 linha por hábito por dia)
create table if not exists habit_completion (
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references habit(id) on delete cascade,
  date date not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, habit_id, date)
);

-- Ledger de faltas de hábito (idempotência)
create table if not exists habit_miss_ledger (
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references habit(id) on delete cascade,
  date date not null,
  penalty_applied_at timestamptz not null default now(),
  primary key (user_id, habit_id, date)
);

-- Tarefas (simplificado)
create table if not exists task (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_date date not null,
  completed_date date
);

-- Ledger de atraso de tarefa (idempotência diária)
create table if not exists task_overdue_ledger (
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references task(id) on delete cascade,
  date date not null,                             -- dia em que estava atrasada
  penalty_applied_at timestamptz not null default now(),
  primary key (user_id, task_id, date)
);

-- Log de eventos (debug/replay)
create table if not exists vitality_event_log (
  event_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,                             -- HABIT_DONE|TASK_DONE|GOAL_DONE|XP_GAIN|COIN_GAIN|DAY_CLOSE
  payload jsonb,
  applied_at timestamptz not null default now()
);
```

### 3.2 Índices úteis
```sql
create index if not exists idx_habit_user_active on habit (user_id) where status='active';
create index if not exists idx_task_user_due on task (user_id, due_date);
create index if not exists idx_habit_completion_user_date on habit_completion (user_id, date);
```

---

## 4) Fórmulas

### 4.1 Penalidade por falta de hábito devido (por dia)
- **Base:** `penalty_per_miss_base = 4`
- **Escassez (hábitos pouco frequentes doem mais):**  
  Estimativa de oportunidades/30d a partir do `RRULE`:
  - DAILY ≈ 30; 3×/semana ≈ 13; 1×/semana ≈ 4; 1×/mês ≈ 1  
  `scarcity = clamp( sqrt(30 / oportunidades_30d), 1.0, 2.0 )`  
  `penalty_per_miss = penalty_per_miss_base * scarcity`

### 4.2 Penalidade de tarefa atrasada (por dia)
- `penalty_overdue_per_day = 2` (ajustável)

### 4.3 Cap diário de penalidade
- `daily_penalty_cap = 20` (soma de todas as penalidades do dia)

### 4.4 Fragilidade no topo (aplicada no fechamento do dia)
Se `prevVitality ≥ 90`:
```
topFragilityDaily = λ * ((prevVitality - 90) / 10) * missFactor
```
- `λ = 6.0`, `missFactor` pode ser 1.0 (ou proporcional a % de misses do dia).

### 4.5 Ganhos positivos (capados)
- Hábito devido concluído no dia: `+0.5`
- Meta concluída: `+2`
- **Cap diário de ganhos**: `+10`

> **Regra de ouro:** um mesmo (hábito, dia) só pode gerar **uma** penalidade (garantido pelo **ledger**).

---

## 5) Fechamento diário (idempotente)

### 5.1 RPC (SQL/PLpgSQL) — fecha um dia para um usuário
```sql
create or replace function vitality_close_day(p_user uuid, p_date date)
returns table (new_value numeric, new_version bigint) language plpgsql as $$
declare
  v_state user_vitality_state;
  v_prev numeric;
  v_penalty_total numeric := 0;
  v_penalty_cap constant numeric := 20;
  v_lambda constant numeric := 6.0;
  v_topfrag numeric := 0;
begin
  select * into v_state from user_vitality_state where user_id = p_user for update;
  if not found then
    insert into user_vitality_state(user_id, value, version, last_close_date)
    values (p_user, 50, 0, (current_date - interval '1 day')::date)
    returning * into v_state;
  end if;

  -- 1) HÁBITOS devidos em p_date (status=active, criado <= p_date, RRULE marca p_date)
  -- Supondo função sql helper due_habits(p_user, p_date) que resolve RRULE -> habit_id list
  for habit_row in
    select h.id, h.rrule
    from habit h
    where h.user_id = p_user and h.status = 'active' and h.created_at <= p_date
      and rrule_is_due(h.rrule, p_date)
  loop
    -- já concluído?
    if not exists (select 1 from habit_completion c where c.user_id=p_user and c.habit_id=habit_row.id and c.date=p_date)
       and not exists (select 1 from habit_miss_ledger m where m.user_id=p_user and m.habit_id=habit_row.id and m.date=p_date)
    then
      -- calcular escassez rápida (exemplos simples; ideal: função que estima oportunidades_30d)
      -- aqui: DAILY=1.0; WEEKLY= sqrt(30/4)=2.74->clamp 2.0; MONTHLY=2.0
      -- (substituir por parser real da RRULE)
      declare
        scarcity numeric := case
          when habit_row.rrule like 'FREQ=DAILY%' then 1.0
          when habit_row.rrule like 'FREQ=WEEKLY%' then 2.0
          when habit_row.rrule like 'FREQ=MONTHLY%' then 2.0
          else 1.2
        end;
        p_miss numeric := 4 * scarcity;
      begin end;

      insert into habit_miss_ledger(user_id, habit_id, date) values (p_user, habit_row.id, p_date)
      on conflict do nothing;

      v_penalty_total := v_penalty_total + p_miss;
    end if;
  end loop;

  -- 2) TAREFAS atrasadas em p_date
  for t in
    select id from task
    where user_id=p_user and due_date <= p_date and (completed_date is null or completed_date > p_date)
  loop
    if not exists (select 1 from task_overdue_ledger l where l.user_id=p_user and l.task_id=t.id and l.date=p_date) then
      insert into task_overdue_ledger(user_id, task_id, date) values (p_user, t.id, p_date)
      on conflict do nothing;
      v_penalty_total := v_penalty_total + 2;
    end if;
  end loop;

  -- 3) Cap diário
  if v_penalty_total > v_penalty_cap then
    v_penalty_total := v_penalty_cap;
  end if;

  v_prev := v_state.value;

  -- 4) Fragilidade topo (se aplicável)
  if v_prev >= 90 then
    v_topfrag := v_lambda * ((v_prev - 90) / 10) * 1.0;
  end if;

  -- 5) Aplica
  v_state.value := greatest(0, least(100, v_prev - v_penalty_total - v_topfrag));
  v_state.version := v_state.version + 1;
  update user_vitality_state
    set value = v_state.value, version = v_state.version, last_close_date = p_date, updated_at=now()
    where user_id = p_user;

  return query select v_state.value, v_state.version;
end;
$$;
```

### 5.2 Fechar múltiplos dias pendentes
```sql
create or replace function vitality_close_days_until(p_user uuid, p_until date)
returns table (new_value numeric, new_version bigint) language plpgsql as $$
declare
  d date;
  st user_vitality_state;
begin
  select * into st from user_vitality_state where user_id=p_user for update;
  if not found then
    insert into user_vitality_state(user_id) values (p_user);
    select * into st from user_vitality_state where user_id=p_user for update;
  end if;

  d := st.last_close_date + interval '1 day';
  while d <= p_until loop
    perform vitality_close_day(p_user, d);
    d := d + interval '1 day';
  end loop;

  return query select value, version from user_vitality_state where user_id=p_user;
end;
$$;
```

---

## 6) RPC de evento (aplica ganhos + garante fechamento pendente)

### 6.1 SQL: `vitality_apply_event`
```sql
create or replace function vitality_apply_event(
  p_user uuid,
  p_event_id uuid,
  p_type text,        -- HABIT_DONE|TASK_DONE|GOAL_DONE|XP_GAIN|COIN_GAIN
  p_payload jsonb,
  p_expected_version bigint
)
returns table (new_value numeric, new_version bigint) language plpgsql as $$
declare
  st user_vitality_state;
  today date := (current_date at time zone 'America/Sao_Paulo')::date;
  gains numeric := 0;
  daily_gain_cap constant numeric := 10;
begin
  -- idempotência de evento
  if exists (select 1 from vitality_event_log where event_id=p_event_id) then
    return query select value, version from user_vitality_state where user_id=p_user;
  end if;

  -- fecha dias pendentes até ontem
  perform vitality_close_days_until(p_user, (today - interval '1 day')::date);

  -- lock e versão
  select * into st from user_vitality_state where user_id=p_user for update;
  if st.version <> p_expected_version then
    raise exception 'version_conflict';
  end if;

  -- aplica ganhos simples capados
  if p_type = 'GOAL_DONE' then gains := gains + 2; end if;
  if p_type = 'HABIT_DONE' then
    -- se a conclusão é de hoje e o hábito estava devido, pequeno ganho
    -- opcional: validar devido no dia via RRULE
    gains := gains + 0.5;
  end if;
  -- (XP_GAIN/COIN_GAIN podem não influenciar vitalidade diretamente; manter neutro)

  -- aplica cap de ganho diário (exercício: exigir uma tabela/day ledger de ganhos)
  gains := least(gains, daily_gain_cap);

  st.value := greatest(0, least(100, st.value + gains));
  st.version := st.version + 1;
  update user_vitality_state set value=st.value, version=st.version, updated_at=now() where user_id=p_user;

  insert into vitality_event_log(event_id, user_id, type, payload) values (p_event_id, p_user, p_type, p_payload);

  return query select st.value, st.version;
end;
$$;
```

---

## 7) Edge Function (Deno/TypeScript) — `sync_open`
> Fecha dias pendentes **na abertura** e retorna o estado oficial (sem recomputar tudo).

```ts
// supabase/functions/sync_open/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { serve } from 'jsr:@std/http/server';

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('user_id')!;  // trocar por JWT do usuário
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Fechar até ontem (timezone Brasil)
    const today = new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' });
    const d = new Date(today); d.setHours(0,0,0,0);
    const yesterday = new Date(d.getTime() - 24*60*60*1000);

    const rpc = await fetch(`${supabaseUrl}/rest/v1/rpc/vitality_close_days_until`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_user: userId, p_until: yesterday.toISOString().slice(0,10) })
    });

    const data = await rpc.json();
    return new Response(JSON.stringify({ ok: true, state: data?.[0] ?? null }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
});
```

---

## 8) Vercel Cron (opcional)
> Se quiser rodar um fechamento global às **03:05 BRT (06:05 UTC)**, use uma rota/Function que chame uma Edge Function ou um RPC que percorra usuários em lote.

### 8.1 `vercel.json`
```json
{
  "crons": [
    {
      "path": "/api/cron/vitality-close",
      "schedule": "5 6 * * *"   // 06:05 UTC = 03:05 BRT
    }
  ]
}
```

### 8.2 API Route (Node/Edge) — aciona fechamento
```ts
// api/cron/vitality-close.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Exemplo simples: invocar Edge Function do Supabase que roda fechamento em lote (paginação)
    const r = await fetch(process.env.SUPABASE_EDGE_SYNC_ALL!, { method: 'POST' });
    const j = await r.json();
    res.status(200).json({ ok: true, result: j });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
```

> **Alternativa:** usar **Supabase Scheduled Functions** (pg_cron + pg_net) para executar a Edge Function diretamente no horário configurado.


---

## 9) Cliente (Vite React) — integração mínima

### 9.1 Listener de Gamificação (pseudo)
```ts
async function syncOpen() {
  const { data } = await fetch(`/functions/v1/sync_open?user_id=${userId}`).then(r=>r.json());
  setVitality(data?.state?.new_value ?? data?.state?.value ?? 50);
  setVersion(data?.state?.new_version ?? data?.state?.version ?? 0);
}

async function applyEvent(type: string, payload: any) {
  // 1) close pending days is executed inside RPC apply
  const eventId = crypto.randomUUID();
  const r = await supabase.rpc('vitality_apply_event', {
    p_user: userId,
    p_event_id: eventId,
    p_type: type,
    p_payload: payload,
    p_expected_version: versionRef.current
  });
  if (r.error) {
    if (r.error.message.includes('version_conflict')) {
      // refetch official state
      await syncOpen();
    } else {
      console.error(r.error);
    }
    return;
  }
  const st = r.data?.[0];
  setVitality(st?.new_value ?? vitalityRef.current);
  setVersion(st?.new_version ?? versionRef.current + 1);
}

// Gamification hooks
onAppOpen(syncOpen);
onHabitDone((habitId) => applyEvent('HABIT_DONE', { habitId }));
onTaskDone((taskId) => applyEvent('TASK_DONE', { taskId }));
onGoalDone((goalId) => applyEvent('GOAL_DONE', { goalId }));
```

### 9.2 Histerese de humor (UI)
```ts
type Mood = 'tired'|'sad'|'neutral'|'happy'|'confident';

function moodFromVitalityHysteresis(
  v: number,
  prev: Mood | null,
  t = { tired:25, sad:50, neutral:75, happy:90, confident:96 },
  h = 4
): Mood {
  const order: Mood[] = ['tired','sad','neutral','happy','confident'];
  const idx = (m: Mood)=> order.indexOf(m);
  const target = (x:number): Mood => x < t.tired ? 'tired' : x < t.sad ? 'sad' : x < t.neutral ? 'neutral' : x < t.happy ? 'happy' : 'confident';
  if (!prev) return target(v);
  const up = (m:Mood)=> m==='tired'?t.sad+h: m==='sad'?t.neutral+h: m==='neutral'?t.happy+h: m==='happy'?t.confident+h: Infinity;
  const down=(m:Mood)=> m==='confident'?t.happy-h: m==='happy'?t.neutral-h: m==='neutral'?t.sad-h: m==='sad'?t.tired-h: -Infinity;
  if (v >= up(prev))   return order[Math.min(idx(prev)+1, order.length-1)];
  if (v <= down(prev)) return order[Math.max(idx(prev)-1, 0)];
  return prev;
}
```

---

## 10) Política de backfill e pausas
- **Backfill depois do fechamento**: por padrão **não reverte** penalidade (modo “hard”).  
  - Opcional: janela de reversão (24h) com `reverse_ledger`.  
- **Pausado/Arquivado**: não gera due; não penaliza.  
- **Criação**: nunca penaliza antes de `created_at`.  
- **Timezone**: `America/Sao_Paulo`; fechamento recomendado **03:05** (ou 06:05 UTC).

---

## 11) Telemetria e tuning
- Logar por dia: soma de penalidades, uso de cap, misses por frequência (daily/weekly/monthly), tarefas atrasadas.  
- Distribuição de Vitalidade (p50/p90/p99), tempo médio em 90+, taxa de quedas >10 pts/dia.  
- Parâmetros para ajuste: `penalty_per_miss_base`, `scarcity max`, `daily_penalty_cap`, `λ topo`, ganhos e caps.

---

## 12) Migração (checklist)
1. Criar tabelas e RPCs (`vitality_close_day`, `vitality_close_days_until`, `vitality_apply_event`).  
2. Mover cálculo de Vitalidade para **server/RPC** (cliente só exibe).  
3. Implementar **sync_on_open** (Edge Function) e substituir qualquer “recalcular no load”.  
4. Atualizar Listener de gamificação para usar `apply_event`.  
5. (Opcional) Configurar **Vercel Cron** ou **Supabase Scheduled Functions**.  
6. Remover “vitalidade de performance” dos relatórios; mostrar **uma Vitalidade** + *breakdown*.

---

## 13) FAQ rápido
- **Precisa do app aberto para penalizar?** Não. Fechamos dias pendentes na abertura e/ou por cron.  
- **E se abrir depois de 3 dias?** Fechamos `[last_close_date+1 … ontem]` de uma vez, **sem duplicar** (ledger).  
- **E multidevice?** Controle de **versão** no estado + **event_id** (idempotência).  
- **Hábito semanal dói mais?** Sim, via **escassez** (até ×2).  
- **Posso ajustar dureza?** Sim: base, escassez, caps e λ do topo.

---

## 14) Notas finais
Este desenho preserva a sensação de jogo: **progresso caro**, **prestígio frágil** no topo e **regras previsíveis**. É simples de operar (idempotente, sem recalcular tudo no load) e robusto para offline/múltiplos dispositivos.
