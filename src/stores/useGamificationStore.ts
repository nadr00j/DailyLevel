import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';
import dayjs from 'dayjs';

import type {
  ActionType,
  GamificationState,
  GamificationConfig,
  Aspect
} from '@/types/gamification';

import defaultConfigJson from '@/config/gamificationConfig.json';

// Forçar recarregamento da configuração
const defaultConfig = defaultConfigJson as GamificationConfig;
console.log('[Gamification Debug] Configuração recarregada:', defaultConfig);

import { toast } from '@/components/ui/use-toast';
import { useVictoryDialog } from '@/stores/useVictoryDialog';
import { usePixelBuddyStore } from '@/stores/usePixelBuddyStore';
import { useHabitStore } from './useHabitStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { dataSyncService } from '@/lib/DataSyncService';

// util: classifica categoria a partir das tags
function resolveCategory(tags: string[] | undefined, cfg: GamificationConfig): string | undefined {
  if (!tags?.length) return undefined;
  
  for (const [name, c] of Object.entries(cfg.categories)) {
    if (tags.some(t => c.tags.includes(t))) {
      return name;
    }
  }
  
  return tags[0];
}

function rollingSum(history: { ts: number; xp: number }[], days = 30) {
  const cutoff = dayjs().subtract(days, 'day').valueOf();
  return history.filter(h => h.ts >= cutoff).reduce((acc, h) => acc + h.xp, 0);
}

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
  
  // 3. TAREFAS: Penalizar tarefas atrasadas (temporariamente desabilitado para evitar erro de hook)
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
  
  // Debug detalhado
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
  
  return finalVitality;
}

function calcAspect(str: number, int: number, cre: number, soc: number): Aspect {
  const arr: Array<{key: Aspect, val: number}> = [
    { key: 'str', val: str },
    { key: 'int', val: int },
    { key: 'cre', val: cre },
    { key: 'soc', val: soc }
  ];
  arr.sort((a, b) => b.val - a.val);
  if (arr[0].val - arr[1].val < 20) return 'bal';
  return arr[0].key as Aspect;
}

// rank helpers
const rankNames = ["Bronze","Prata","Ouro","Platina","Diamante","Champion","Grand Champ."] as const;

function calcRank(xp:number){
  if(xp>=4200) return {idx:24, tier:"God", div:0};
  const idx = Math.floor(xp/200); // 0..23
  const tierIdx = Math.floor(idx/3); // 0..6
  const div = (idx%3)+1; //1..3
  return {idx, tier:rankNames[tierIdx], div};
}

const storage = createJSONStorage(() => ({
  getItem: async (name: string) => (await localforage.getItem<string>(name)) ?? null,
  setItem: async (name: string, value: string) => { await localforage.setItem(name, value); },
  removeItem: async (name: string) => { await localforage.removeItem(name); }
}));

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
        // ------- estado inicial -------
        xp: 0,
        coins: 0,
        xp30d: 0,
        vitality: 10,
        mood: 'neutral',
        xpMultiplier: 1,
        xpMultiplierExpiry: 0,

        str: 0, int: 0, cre: 0, soc: 0,
        aspect: 'bal',

        rankIdx: 0, rankTier: 'Bronze', rankDiv: 1,

        history: [],
        config: defaultConfig,

        // ------- ações -------
        addXp: (type, tags) => {
          console.log('[AddXP Debug] Função addXp chamada com:', { type, tags });
          
          const state = get();
          // Capturar rank anterior
          const prevRankIdx = state.rankIdx;
          // Usar a configuração atualizada em vez da persistida
          const cfg = defaultConfig;
          
          console.log('[AddXP Debug] Estado atual:', {
            type,
            tags,
            baseXp: cfg.points[type],
            currentXp: state.xp,
            currentCoins: state.coins,
            config: cfg
          });
          
          // Calcular XP base usando a estrutura correta
          let baseXp = cfg.points[type] || 10;
          
          // Aplicar multiplicador se ativo
          const multiplier = state.xpMultiplier;
          const finalXp = Math.floor(baseXp * multiplier);
          
          // Atualizar XP
          const newXp = state.xp + finalXp;
          const newCoins = Math.floor(newXp * cfg.points.coinsPerXp);
          
          console.log('[AddXP Debug] Calculado:', {
            baseXp,
            multiplier,
            finalXp,
            newXp,
            newCoins
          });
          
          // Calcular novo rank baseado no XP total
          const { idx: newRankIdx, tier: newRankTier, div: newRankDiv } = calcRank(newXp);
          const newRank = { tier: newRankTier, div: newRankDiv };
          console.log('[AddXP Debug] Rank calculado:', { newRankIdx, newRank });
          
          // Garantir que tags seja um array
          const safeTags = tags || [];
          
          // Atualizar atributos baseado nas tags
          const newStr = state.str + (safeTags.includes('strength') ? finalXp : 0);
          const newInt = state.int + (safeTags.includes('intelligence') ? finalXp : 0);
          const newCre = state.cre + (safeTags.includes('creativity') ? finalXp : 0);
          const newSoc = state.soc + (safeTags.includes('social') ? finalXp : 0);
          
          // Calcular novo aspecto
          let newAspect: Aspect = 'bal';
          try {
            newAspect = calcAspect(newStr, newInt, newCre, newSoc);
            console.log('[AddXP Debug] Aspecto calculado:', newAspect);
          } catch (error) {
            console.error('[AddXP Debug] Erro ao calcular aspecto:', error);
          }
          
          // Calcular vitalidade (XP dos últimos 30 dias)
          const now = Date.now();
          const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
          const recentHistory = state.history.filter(h => h.ts > thirtyDaysAgo);
          let newXp30d = 0;
          try {
            newXp30d = rollingSum(recentHistory) + finalXp;
            console.log('[AddXP Debug] XP30d calculado:', newXp30d);
          } catch (error) {
            console.error('[AddXP Debug] Erro ao calcular XP30d:', error);
            newXp30d = finalXp;
          }
          
          let newVitality = 0;
          try {
            newVitality = Math.floor(calcVitality(newXp30d, cfg, state.history));
            console.log('[AddXP Debug] Vitalidade calculada:', newVitality);
          } catch (error) {
            console.error('[AddXP Debug] Erro ao calcular vitalidade:', error);
            newVitality = 0;
          }
          
          // Calcular humor baseado na vitalidade
          let newMood = 'neutral';
          try {
            newMood = getMoodFromVitality(newVitality);
            console.log('[AddXP Debug] Humor calculado:', newMood);
          } catch (error) {
            console.error('[AddXP Debug] Erro ao calcular humor:', error);
          }
          
          // Atualizar estado
          try {
            set({
              xp: newXp,
              coins: newCoins,
              xp30d: newXp30d,
              vitality: newVitality,
              mood: newMood as 'happy' | 'neutral' | 'tired' | 'sad',
              str: newStr,
              int: newInt,
              cre: newCre,
              soc: newSoc,
              aspect: newAspect,
              rankIdx: newRankIdx,
              rankTier: newRankTier,
              rankDiv: newRankDiv,
              history: [...state.history, {
                ts: now,
                type,
                xp: finalXp,
                coins: Math.floor(finalXp * cfg.points.coinsPerXp),
                tags: safeTags,
                category: (() => {
                  try {
                    console.log('[AddXP Debug] Resolvendo categoria:', { tags: safeTags, configCategories: Object.keys(cfg.categories) });
                    const resolvedCategory = resolveCategory(safeTags, cfg);
                    console.log('[AddXP Debug] Categoria resolvida:', { tags: safeTags, category: resolvedCategory });
                    return resolvedCategory;
                  } catch (error) {
                    console.error('[AddXP Debug] Erro ao resolver categoria:', error);
                    return undefined;
                  }
                })()
              }]
            });
            console.log('[AddXP Debug] Estado atualizado com sucesso');
            // Disparar diálogo de vitória se subiu de rank
            if (newRankIdx > prevRankIdx) {
              const roman = ['I','II','III'];
              const divLabel = newRank.div === 0 ? '' : roman[newRank.div - 1];
              const iconPath = `/ranks/${newRank.tier.toUpperCase()} ${divLabel}.png`;
              useVictoryDialog.getState().show('Promoção de Rank!', 0, iconPath);
            }
          } catch (error) {
            console.error('[AddXP Debug] Erro ao atualizar estado:', error);
          }
          
          // Atualizar PixelBuddy automaticamente
          try {
            updatePixelBuddyState(newXp, newVitality, newMood);
            console.log('[AddXP Debug] PixelBuddy atualizado com sucesso');
          } catch (error) {
            console.error('[AddXP Debug] Erro ao atualizar PixelBuddy:', error);
          }
          
          // Toast será exibido automaticamente pelo GamificationListener
          console.log('[AddXP Debug] XP adicionado, GamificationListener irá exibir o toast');
        },

        setConfig: (partial) => {
          set(({ config }) => ({ config: { ...config, ...partial } }));
        },

                         init: () => {
          const state = get();
          // Usar a configuração atualizada em vez da persistida
          const cfg = defaultConfig;
          
          // Recalcular vitalidade baseada no histórico atual
          const now = Date.now();
          const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
          const recentHistory = state.history.filter(h => h.ts > thirtyDaysAgo);
          const newXp30d = rollingSum(recentHistory);
          const newVitality = Math.floor(calcVitality(newXp30d, cfg, state.history));
          
          // Recalcular humor baseado na vitalidade
          const newMood = getMoodFromVitality(newVitality);
          
          // Recalcular rank se necessário
          let rankUpdate = {};
          if (state.xp > 0) {
            const { idx, tier, div } = calcRank(state.xp);
            rankUpdate = {
              rankIdx: idx,
              rankTier: tier,
              rankDiv: div
            };
          }
          
          set({
            xp30d: newXp30d,
            vitality: newVitality,
            mood: newMood as 'happy' | 'neutral' | 'tired' | 'sad',
            ...rankUpdate
          });
          
          // Atualizar PixelBuddy
          updatePixelBuddyState(state.xp, newVitality, newMood);
        }
       }),
    {
      name: 'dl.gamification.v1',
      storage,
      partialize: (state) => ({
        xp: state.xp,
        coins: state.coins,
        xp30d: state.xp30d,
        vitality: state.vitality,
        mood: state.mood,
        xpMultiplier: state.xpMultiplier,
        xpMultiplierExpiry: state.xpMultiplierExpiry,
        str: state.str,
        int: state.int,
        cre: state.cre,
        soc: state.soc,
        aspect: state.aspect,
        rankIdx: state.rankIdx,
        rankTier: state.rankTier,
        rankDiv: state.rankDiv,
        history: state.history,
        config: state.config
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recalcular vitalidade ao carregar o app
          // Usar a configuração atualizada em vez da persistida
          const cfg = defaultConfig;
          const now = Date.now();
          const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
          const recentHistory = state.history.filter(h => h.ts > thirtyDaysAgo);
          const newXp30d = rollingSum(recentHistory);
          const newVitality = Math.floor(calcVitality(newXp30d, cfg, state.history));
          const newMood = getMoodFromVitality(newVitality);
          
          // Atualizar estado com vitalidade recalculada
          state.xp30d = newXp30d;
          state.vitality = newVitality;
          state.mood = newMood as 'happy' | 'neutral' | 'tired' | 'sad';
          
          // Atualizar PixelBuddy
          updatePixelBuddyState(state.xp, newVitality, newMood);
        }
      }
    }
  )
);

// Função para atualizar o estado do PixelBuddy baseado no XP e vitalidade
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
  
  // Atualizar head baseado na vitalidade e humor
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
  
  // Aplicar mudanças apenas se diferentes
  if (pixelBuddyStore.body !== newBody) {
    pixelBuddyStore.setBase('body', newBody);
  }
  
  if (pixelBuddyStore.head !== newHead) {
    pixelBuddyStore.setBase('head', newHead);
  }
}

// Função para determinar o humor baseado na vitalidade
function getMoodFromVitality(vitality: number): string {
  if (vitality < 25) return 'tired';
  if (vitality < 50) return 'sad';
  if (vitality < 75) return 'neutral';
  if (vitality < 90) return 'happy';
  return 'confident';
}
