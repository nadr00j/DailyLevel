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
import { db } from '@/lib/database';

// util: classifica categoria a partir das tags
function resolveCategory(tags: string[] | undefined, cfg: GamificationConfig): string | undefined {
  if (!tags?.length) {
    return undefined;
  }
  
  // Primeiro, verificar se alguma tag corresponde a uma categoria configurada
  for (const [name, c] of Object.entries(cfg.categories)) {
    const matchingTags = tags.filter(t => c.tags.includes(t));
    if (matchingTags.length > 0) {
      console.log('[ResolveCategory Debug] Encontrou categoria por tags:', { 
        categoryName: name, 
        matchingTags, 
        categoryTags: c.tags 
      });
      return name;
    }
  }
  
  // Se não encontrou correspondência, verificar se alguma tag é uma categoria válida
  for (const tag of tags) {
    if (cfg.categories[tag]) {
      console.log('[ResolveCategory Debug] Encontrou categoria direta:', { tag });
      return tag;
    }
  }
  
  // Se não encontrou nada, retornar undefined (sem categoria)
  console.log('[ResolveCategory Debug] Nenhuma categoria encontrada, retornando undefined');
  return undefined;
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
  
  // IMPORTANTE: Penalidades de hábitos e tarefas não concluídas são aplicadas 
  // automaticamente pelo sistema Supabase (vitality_close_day) UMA VEZ POR DIA.
  // NÃO calcular penalidades aqui para evitar duplicação!
  
  // 2. METAS: Bônus por metas concluídas (sem penalidade)
  let goalBonus = 0;
  const completedGoalsToday = history.filter(item => 
    item.type === 'goal' && 
    item.ts >= todayStart && 
    item.ts <= todayEnd
  ).length;
  
  goalBonus = completedGoalsToday * 5; // 5 pontos por meta concluída
  
  // 3. USO DO APP: Bônus por atividade hoje (sem penalidade para evitar duplicação)
  let activityBonus = 0;
  const hasActivityToday = history.some(item => 
    item.ts >= todayStart && item.ts <= todayEnd
  );
  
  if (hasActivityToday) {
    activityBonus = 2; // Pequeno bônus por usar o app hoje
  }
  
  // 4. CONSISTÊNCIA: Bônus por uso diário nos últimos 7 dias
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
  
  // 5. CALCULAR VITALIDADE FINAL (apenas bônus locais)
  // IMPORTANTE: As penalidades são aplicadas pelo Supabase via vitality_close_day()
  // Este valor é usado apenas para referência local
  const localVitality = Math.max(0, Math.min(100, 
    baseVitality + goalBonus + consistencyBonus + activityBonus
  ));
  
  // Debug detalhado (removido logs de penalidades que não são mais calculadas aqui)
  console.log('[Vitality Debug - Local Only]', {
    baseVitality: Math.round(baseVitality),
    goalBonus: Math.round(goalBonus),
    activityBonus: Math.round(activityBonus),
    consistencyBonus: Math.round(consistencyBonus),
    localVitality: Math.round(localVitality),
    completedGoalsToday,
    hasActivityToday,
    activeDays
  });
  
  return localVitality;
}

// Função para calcular rank baseado no XP
function calcRank(xp: number) {
  if (xp >= 4200) return { idx: 24, tier: "God", div: 0 };
  const idx = Math.floor(xp / 200); // 0..23
  const tierIdx = Math.floor(idx / 3); // 0..6
  const div = (idx % 3) + 1; // 1..3
  const rankNames = ["Bronze", "Prata", "Ouro", "Platina", "Diamante", "Champion", "Grand Champ."] as const;
  return { idx, tier: rankNames[tierIdx], div };
}

// Função para calcular atributos baseado no histórico
function calcAttributes(history: any[], cfg: GamificationConfig) {
  const attrs = { str: 0, int: 0, cre: 0, soc: 0 };
  
  history.forEach(item => {
    const category = resolveCategory(item.tags, cfg);
    if (category && cfg.categories[category]) {
      const cat = cfg.categories[category];
      // Usar weight como base para atributos (simplificado)
      attrs.str += cat.weight || 0;
      attrs.int += cat.weight || 0;
      attrs.cre += cat.weight || 0;
      attrs.soc += cat.weight || 0;
    }
  });
  
  return attrs;
}

// Função para determinar aspecto dominante
function calcAspect(attrs: { str: number; int: number; cre: number; soc: number }): Aspect {
  const { str, int, cre, soc } = attrs;
  const max = Math.max(str, int, cre, soc);
  const diff = max - Math.min(str, int, cre, soc);
  
  if (diff >= 20) {
    if (str === max) return 'str';
    if (int === max) return 'int';
    if (cre === max) return 'cre';
    if (soc === max) return 'soc';
  }
  
  return 'bal';
}

const storage = createJSONStorage(() => ({
  getItem: async (name: string) => (await localforage.getItem<string>(name)) ?? null,
  setItem: async (name: string, value: string) => { await localforage.setItem(name, value); },
  removeItem: async (name: string) => { await localforage.removeItem(name); }
}));

export const useGamificationStoreV21 = create<GamificationState>()(
  persist(
    (set, get) => ({
      // ------- estado inicial -------
      xp: 0,
      coins: 0,
      xp30d: 0,
      vitality: 10,
      mood: 'neutral' as const,
      xpMultiplier: 1,
      xpMultiplierExpiry: 0,
      str: 0,
      int: 0,
      cre: 0,
      soc: 0,
      aspect: 'bal' as Aspect,
      rankIdx: 0,
      rankTier: 'Bronze',
      rankDiv: 1,
      history: [],
      config: defaultConfig,

      // ------- ações -------
      addXp: (type: ActionType, tags?: string[]) => {
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
          newAspect = calcAspect({ str: newStr, int: newInt, cre: newCre, soc: newSoc });
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
        
        // IMPORTANTE: Usar vitalidade do Supabase (via useVitalityV21) ao invés de calcular localmente
        // O cálculo local é mantido apenas para fallback/debug
        let newVitality = state.vitality; // Manter valor atual por padrão
        
        // Tentar obter valor do Supabase se disponível
        try {
          // O valor real da vitalidade vem do useVitalityV21 que sincroniza com Supabase
          // Este cálculo local é apenas para referência e não deve ser usado como valor final
          const localVitality = Math.floor(calcVitality(newXp30d, cfg, state.history));
          console.log('[AddXP Debug] Vitalidade local (referência):', localVitality, '| Vitalidade atual (Supabase):', state.vitality);
          
          // Usar valor atual do state (que vem do Supabase via useVitalityV21)
          newVitality = state.vitality;
        } catch (error) {
          console.error('[AddXP Debug] Erro ao calcular vitalidade de referência:', error);
          newVitality = state.vitality; // Manter valor atual
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
        
        // Salvar no history_items do Supabase
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          const historyEntry = {
            ts: now,
            type,
            xp: finalXp,
            coins: Math.floor(finalXp * cfg.points.coinsPerXp),
            tags: safeTags,
            category: (() => {
              try {
                const resolvedCategory = resolveCategory(safeTags, cfg);
                return resolvedCategory;
              } catch (error) {
                console.error('[AddXP Debug] Erro ao resolver categoria para history:', error);
                return undefined;
              }
            })()
          };
          
          console.log('[AddXP Debug] Salvando no history_items:', historyEntry);
          db.addHistoryItem(userId, historyEntry)
            .then(() => {
              console.log('[AddXP Debug] Item salvo no history_items com sucesso');
            })
            .catch(err => {
              console.error('[AddXP Debug] Erro ao salvar no history_items:', err);
            });
        }

        // Atualizar PixelBuddy automaticamente
        try {
          updatePixelBuddyState(newXp, newVitality, newMood);
          console.log('[AddXP Debug] PixelBuddy atualizado com sucesso');
        } catch (error) {
          console.error('[AddXP Debug] Erro ao atualizar PixelBuddy:', error);
        }
        
        // Toast será exibido automaticamente pelo GamificationListener
        console.log('[AddXP Debug] XP adicionado, toast será exibido pelo GamificationListener');
      },

      setXpMultiplier: (multiplier: number, duration: number) => {
        set({
          xpMultiplier: multiplier,
          xpMultiplierExpiry: Date.now() + duration
        });
      },

      // Métodos para resetar (debug)
      resetXp: () => {
        set({ xp: 0 });
      },
      
      resetCoins: () => {
        set({ coins: 0 });
      },
      
      resetHistory: () => {
        set({ history: [] });
      },
      
      resetAll: () => {
        set({
          xp: 0,
          coins: 0,
          xp30d: 0,
          vitality: 50,
          mood: 'neutral',
          str: 0,
          int: 0,
          cre: 0,
          soc: 0,
          aspect: 'bal',
          rankIdx: 0,
          rankTier: 'BRONZE',
          rankDiv: 1,
          history: []
        });
      },

      // Função para sincronizar vitalidade do Supabase
      syncVitalityFromSupabase: (vitalityValue: number) => {
        const state = get();
        const newMood = getMoodFromVitality(vitalityValue);
        
        console.log('[GamificationStore] Sincronizando vitalidade do Supabase:', {
          anterior: state.vitality,
          nova: vitalityValue,
          mood: newMood
        });
        
        set({
          vitality: vitalityValue,
          mood: newMood as 'happy' | 'neutral' | 'tired' | 'sad'
        });
        
        // Atualizar PixelBuddy com nova vitalidade
        updatePixelBuddyState(state.xp, vitalityValue, newMood);
      },

      // Função para sincronizar dados do Supabase
      syncFromSupabase: (data: any) => {
        console.log('[Gamification V2.1] syncFromSupabase chamado com dados:', data);
        
        if (data) {
          const newRank = calcRank(data.xp);
          const newAttrs = calcAttributes(data.history || [], data.config || defaultConfig);
          const newAspect = calcAspect(newAttrs);
          
          console.log('[Gamification V2.1] Calculando novos valores:', {
            xp: data.xp,
            newRank,
            newAttrs,
            newAspect
          });
          
          set({
            xp: data.xp || 0,
            coins: data.coins || 0,
            xp30d: data.xp30d || 0,
            str: newAttrs.str,
            int: newAttrs.int,
            cre: newAttrs.cre,
            soc: newAttrs.soc,
            aspect: newAspect,
            rankIdx: newRank.idx,
            rankTier: newRank.tier,
            rankDiv: newRank.div,
            history: data.history || [],
            config: data.config || defaultConfig
          });
          
          console.log('[Gamification V2.1] Store atualizado com dados do Supabase');
        } else {
          console.log('[Gamification V2.1] syncFromSupabase: dados vazios ou nulos');
        }
      },

      setConfig: (cfg: Partial<GamificationConfig>) => {
        set({ config: { ...get().config, ...cfg } });
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
      name: 'dl.gamification.v21',
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
          
          // IMPORTANTE: NÃO recalcular vitalidade aqui - ela vem do Supabase via useVitalityV21
          // Manter valor persistido e deixar o useVitalityV21 sincronizar
          const currentVitality = state.vitality || 50; // Usar valor persistido ou padrão
          const newMood = getMoodFromVitality(currentVitality);
          
          console.log('[Rehydrate] Mantendo vitalidade persistida:', currentVitality, '(será sincronizada pelo useVitalityV21)');
          
          // Atualizar apenas XP30d e mood
          state.xp30d = newXp30d;
          state.mood = newMood as 'happy' | 'neutral' | 'tired' | 'sad';
          // state.vitality permanece como estava (será atualizada pelo useVitalityV21)
          
          // Atualizar PixelBuddy
          updatePixelBuddyState(state.xp, currentVitality, newMood);
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
