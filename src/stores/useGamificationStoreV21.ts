import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';
import dayjs from 'dayjs';
import { db } from '@/lib/database';
import { useAuthStore } from '@/stores/useAuthStore';

import type {
  ActionType,
  GamificationState,
  GamificationConfig,
  Aspect
} from '@/types/gamification';

import defaultConfigJson from '@/config/gamificationConfig.json';

// Forçar recarregamento da configuração
const defaultConfig = defaultConfigJson as GamificationConfig;

import { toast } from '@/components/ui/use-toast';
import { useVictoryDialog } from '@/stores/useVictoryDialog';
import { usePixelBuddyStore } from '@/stores/usePixelBuddyStore';
import { useHabitStore } from './useHabitStore';
import { dataSyncService } from '@/lib/DataSyncService';
import { findCanonicalCategory } from '@/lib/categoryUtils';

// util: classifica categoria a partir das tags
function resolveCategory(tags: string[] | undefined, cfg: GamificationConfig): string | undefined {
  if (!tags?.length) {
    return undefined;
  }
  
  // Primeiro, verificar se alguma tag corresponde a uma categoria configurada
  for (const [name, c] of Object.entries(cfg.categories)) {
    const matchingTags = tags.filter(t => c.tags.includes(t));
    if (matchingTags.length > 0) {
      return name;
    }
  }
  
  // Se não encontrou correspondência, verificar se alguma tag é uma categoria válida
  for (const tag of tags) {
    if (cfg.categories[tag]) {
      return tag;
    }
  }
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
  
  // 2. METAS: Bônus por metas concluídas (AUMENTADO)
  let goalBonus = 0;
  const completedGoalsToday = history.filter(item => 
    item.type === 'goal' && 
    item.ts >= todayStart && 
    item.ts <= todayEnd
  ).length;
  
  goalBonus = completedGoalsToday * 25; // SUPER AUMENTADO: 25 pontos por meta concluída
  
  // 3. USO DO APP: Bônus por atividade hoje (AUMENTADO)
  let activityBonus = 0;
  const activitiesToday = history.filter(item => 
    item.ts >= todayStart && item.ts <= todayEnd
  ).length;
  
  if (activitiesToday > 0) {
    // Bônus progressivo SUPER AUMENTADO: mais atividades = muito mais bônus
    activityBonus = Math.min(40, 10 + (activitiesToday * 4)); // 10 base + 4 por atividade, máximo 40
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
  
  consistencyBonus = (activeDays / 7) * 35; // SUPER AUMENTADO: Até 35 pontos por consistência
  
  // 5. BÔNUS POR HÁBITOS E TAREFAS COMPLETADAS HOJE (NOVO)
  let completionBonus = 0;
  const habitsCompletedToday = history.filter(item => 
    item.type === 'habit' && 
    item.ts >= todayStart && 
    item.ts <= todayEnd
  ).length;
  
  const tasksCompletedToday = history.filter(item => 
    item.type === 'task' && 
    item.ts >= todayStart && 
    item.ts <= todayEnd
  ).length;
  
  completionBonus = (habitsCompletedToday * 8) + (tasksCompletedToday * 10); // SUPER AUMENTADO: 8 por hábito, 10 por tarefa
  
  // 6. BÔNUS DE PRODUTIVIDADE: Bônus extra por completar múltiplas atividades (NOVO)
  let productivityBonus = 0;
  const totalCompletions = habitsCompletedToday + tasksCompletedToday + completedGoalsToday;
  
  if (totalCompletions >= 3) {
    productivityBonus = 15; // Bônus por ser produtivo (3+ atividades)
  }
  if (totalCompletions >= 5) {
    productivityBonus = 25; // Bônus maior por alta produtividade (5+ atividades)
  }
  if (totalCompletions >= 8) {
    productivityBonus = 40; // Bônus máximo por super produtividade (8+ atividades)
  }
  
  // 7. CALCULAR VITALIDADE FINAL (apenas bônus locais)
  // IMPORTANTE: As penalidades são aplicadas pelo Supabase via vitality_close_day()
  // Este valor é usado apenas para referência local
  const localVitality = Math.max(0, Math.min(100, 
    baseVitality + goalBonus + consistencyBonus + activityBonus + completionBonus + productivityBonus
  ));
  
  
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
      userId: '',
      xp: (() => {
        try {
          const quickSave = localStorage.getItem('dl-quick-stats');
          if (quickSave) {
            const data = JSON.parse(quickSave);
            console.log('[Store Init] 🔄 Carregando XP do localStorage:', data.xp);
            return data.xp || 0;
          }
        } catch (error) {
          console.error('[Store Init] Erro ao carregar XP do localStorage:', error);
        }
        return 0;
      })(),
      coins: (() => {
        try {
          const quickSave = localStorage.getItem('dl-quick-stats');
          if (quickSave) {
            const data = JSON.parse(quickSave);
            console.log('[Store Init] 🔄 Carregando Coins do localStorage:', data.coins);
            return data.coins || 0;
          }
        } catch (error) {
          console.error('[Store Init] Erro ao carregar Coins do localStorage:', error);
        }
        return 0;
      })(),
      xp30d: 0,
      vitality: (() => {
        try {
          const quickSave = localStorage.getItem('dl-quick-stats');
          if (quickSave) {
            const data = JSON.parse(quickSave);
            return data.vitality || 10;
          }
        } catch (error) {
          console.error('[Store Init] Erro ao carregar Vitality do localStorage:', error);
        }
        return 10;
      })(),
      mood: 'neutral' as const,
      xpMultiplier: 1,
      xpMultiplierExpiry: 0,
      str: 0,
      int: 0,
      cre: 0,
      soc: 0,
      aspect: 'bal' as Aspect,
      rankIdx: (() => {
        try {
          const quickSave = localStorage.getItem('dl-quick-stats');
          if (quickSave) {
            const data = JSON.parse(quickSave);
            return data.rankIdx || 0;
          }
        } catch (error) {
          console.error('[Store Init] Erro ao carregar RankIdx do localStorage:', error);
        }
        return 0;
      })(),
      rankTier: (() => {
        try {
          const quickSave = localStorage.getItem('dl-quick-stats');
          if (quickSave) {
            const data = JSON.parse(quickSave);
            return data.rankTier || 'Bronze';
          }
        } catch (error) {
          console.error('[Store Init] Erro ao carregar RankTier do localStorage:', error);
        }
        return 'Bronze';
      })(),
      rankDiv: (() => {
        try {
          const quickSave = localStorage.getItem('dl-quick-stats');
          if (quickSave) {
            const data = JSON.parse(quickSave);
            return data.rankDiv || 1;
          }
        } catch (error) {
          console.error('[Store Init] Erro ao carregar RankDiv do localStorage:', error);
        }
        return 1;
      })(),
      history: [],
      config: defaultConfig,

      // ------- ações -------
      addXp: (type: ActionType, tags?: string[], explicitCategory?: string) => {
        const state = get();
        // Capturar rank anterior
        const prevRankIdx = state.rankIdx;
        // Usar a configuração atualizada em vez da persistida
        const cfg = defaultConfig;
        
        // Calcular XP base usando a estrutura correta
        let baseXp = cfg.points[type] || 10;
        
        // Aplicar multiplicador se ativo
        const multiplier = state.xpMultiplier;
        const finalXp = Math.floor(baseXp * multiplier);
        
        // Atualizar XP
        const newXp = state.xp + finalXp;
        const newCoins = Math.floor(newXp * cfg.points.coinsPerXp);
        
        // Calcular novo rank baseado no XP total
        const { idx: newRankIdx, tier: newRankTier, div: newRankDiv } = calcRank(newXp);
        const newRank = { tier: newRankTier, div: newRankDiv };
        
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
        } catch (error) {
          console.error('[AddXP] Erro ao calcular aspecto:', error);
        }
        
        // Calcular vitalidade (XP dos últimos 30 dias)
        const now = Date.now();
        const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
        const recentHistory = state.history.filter(h => h.ts > thirtyDaysAgo);
        let newXp30d = 0;
        try {
          newXp30d = rollingSum(recentHistory) + finalXp;
        } catch (error) {
          console.error('[AddXP] Erro ao calcular XP30d:', error);
          newXp30d = finalXp;
        }
        
        // RECALCULAR VITALIDADE: Usar o cálculo local atualizado com os novos bônus
        let newVitality = state.vitality; // Fallback
        
        try {
          // Incluir a nova ação no histórico para o cálculo
          const updatedHistory = [...state.history, {
            ts: now,
            type,
            xp: finalXp,
            coins: Math.floor(finalXp * cfg.points.coinsPerXp),
            tags: safeTags,
            category: explicitCategory || resolveCategory(safeTags, cfg)
          }];
          
          // Calcular vitalidade com o histórico atualizado
          newVitality = Math.floor(calcVitality(newXp30d, cfg, updatedHistory));
          
          console.log('🎉 [VITALITY BOOST] VITALIDADE RECALCULADA! 🎉', {
            '🔸 ANTES': state.vitality,
            '🔸 DEPOIS': newVitality,
            '🔸 MUDANÇA': `+${newVitality - state.vitality}`,
            '🔸 XP30D': newXp30d,
            '🔸 HISTÓRICO': updatedHistory.length
          });
          
          // Log detalhado dos bônus
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayStart = today.getTime();
          const todayEnd = todayStart + (24 * 60 * 60 * 1000) - 1;
          
          const todayActivities = updatedHistory.filter(item => 
            item.ts >= todayStart && item.ts <= todayEnd
          );
          
          const habitsToday = todayActivities.filter(item => item.type === 'habit').length;
          const tasksToday = todayActivities.filter(item => item.type === 'task').length;
          const goalsToday = todayActivities.filter(item => item.type === 'goal').length;
          
          const baseVitality = Math.min(100, (newXp30d / cfg.points.vitalityMonthlyTarget) * 100);
          const goalBonus = goalsToday * 25;
          const activityBonus = todayActivities.length > 0 ? Math.min(40, 10 + (todayActivities.length * 4)) : 0;
          const completionBonus = (habitsToday * 8) + (tasksToday * 10);
          
          const totalCompletions = habitsToday + tasksToday + goalsToday;
          let productivityBonus = 0;
          if (totalCompletions >= 3) productivityBonus = 15;
          if (totalCompletions >= 5) productivityBonus = 25;
          if (totalCompletions >= 8) productivityBonus = 40;
          
          console.log('📊 [VITALITY BREAKDOWN] Detalhamento dos bônus:', {
            '🎯 Base (XP30d)': Math.round(baseVitality * 100) / 100,
            '🏆 Metas (25 cada)': goalBonus,
            '⚡ Atividade': activityBonus,
            '✅ Conclusões': completionBonus,
            '🚀 Produtividade': productivityBonus,
            '📅 Hoje': { hábitos: habitsToday, tarefas: tasksToday, metas: goalsToday }
          });
        } catch (error) {
          console.error('[AddXP] ❌ Erro ao recalcular vitalidade:', error);
          newVitality = state.vitality; // Manter valor atual em caso de erro
        }
        
        // Calcular humor baseado na vitalidade
        let newMood = 'neutral';
        try {
          newMood = getMoodFromVitality(newVitality);
        } catch (error) {
          console.error('[AddXP] Erro ao calcular humor:', error);
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
                  return resolveCategory(safeTags, cfg);
                } catch (error) {
                  console.error('[AddXP] Erro ao resolver categoria:', error);
                  return undefined;
                }
              })()
            }]
          });

          // CRÍTICO: Salvar XP/moedas/rank no localStorage imediatamente
          try {
            const quickSave = {
              xp: newXp,
              coins: newCoins,
              vitality: newVitality,
              rankIdx: newRankIdx,
              rankTier: newRankTier,
              rankDiv: newRankDiv,
              lastUpdated: Date.now()
            };
            localStorage.setItem('dl-quick-stats', JSON.stringify(quickSave));
            console.log('[AddXP] 💾 Dados salvos no localStorage:', quickSave);
          } catch (error) {
            console.error('[AddXP] Erro ao salvar no localStorage:', error);
          }
          
          // Disparar diálogo de vitória se subiu de rank
          if (newRankIdx > prevRankIdx) {
            const roman = ['I','II','III'];
            const divLabel = newRank.div === 0 ? '' : roman[newRank.div - 1];
            const iconPath = `/ranks/${newRank.tier.toUpperCase()} ${divLabel}.png`;
            useVictoryDialog.getState().show('Promoção de Rank!', 0, iconPath);
          }
        } catch (error) {
          console.error('[AddXP] Erro ao atualizar estado:', error);
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
              // Função para capitalizar primeira letra
              const capitalizeFirstLetter = (str: string) => {
                if (!str) return str;
                return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
              };
              
              // Usar categoria explícita se fornecida, senão resolver pelas tags
              if (explicitCategory) {
                return capitalizeFirstLetter(explicitCategory);
              }
              
              try {
                const resolvedCategory = resolveCategory(safeTags, cfg);
                return resolvedCategory ? capitalizeFirstLetter(resolvedCategory) : resolvedCategory;
              } catch (error) {
                console.error('[AddXP] Erro ao resolver categoria para history:', error);
                return undefined;
              }
            })()
          };
          
          db.addHistoryItem(userId, historyEntry)
            .catch(err => {
              console.error('[AddXP] Erro ao salvar no history_items:', err);
            });
        }

        // Atualizar PixelBuddy automaticamente
        try {
          updatePixelBuddyState(newXp, newVitality, newMood);
        } catch (error) {
          console.error('[AddXP] Erro ao atualizar PixelBuddy:', error);
        }

        // CRÍTICO: Salvar dados atualizados no Supabase imediatamente
        if (userId) {
          try {
            // Usar os valores calculados diretamente, não get() que pode estar desatualizado
            const dataToSave = {
              userId,
              xp: newXp,
              coins: newCoins,
              xp30d: newXp30d,
              vitality: newVitality,
              mood: newMood,
              str: newStr,
              int: newInt,
              cre: newCre,
              soc: newSoc,
              aspect: newAspect,
              rankIdx: newRankIdx,
              rankTier: newRankTier,
              rankDiv: newRankDiv,
              xpMultiplier: state.xpMultiplier,
              xpMultiplierExpiry: state.xpMultiplierExpiry,
              history: [...state.history, {
                ts: now,
                type,
                xp: finalXp,
                coins: Math.floor(finalXp * cfg.points.coinsPerXp),
                tags: safeTags,
                category: explicitCategory ? findCanonicalCategory(explicitCategory) : resolveCategory(safeTags, cfg)
              }]
            };
            
            console.log('[AddXP] 🔄 Salvando no Supabase COM VITALIDADE RECALCULADA:', { 
              xp: dataToSave.xp, 
              coins: dataToSave.coins, 
              vitality: dataToSave.vitality 
            });
            
            db.saveGamificationData(dataToSave).then((savedData) => {
              console.log('[AddXP] ✅ Dados salvos no Supabase com sucesso (incluindo vitalidade):', savedData.vitality);
              
              // 🛡️ PROTEÇÃO: Marcar que acabamos de salvar para evitar sobrescrita
              const protectionFlag = {
                vitality: newVitality,
                timestamp: Date.now(),
                protected: true
              };
              localStorage.setItem('dl-vitality-protection', JSON.stringify(protectionFlag));
              
              console.log('[AddXP] 🛡️ Proteção de vitalidade ativada por 15 segundos');
              
              // 🔄 FORÇAR ATUALIZAÇÃO: Garantir que o estado local está correto
              const currentState = get();
              if (currentState.vitality !== newVitality) {
                console.log('[AddXP] 🔄 Corrigindo vitalidade no estado local:', {
                  atual: currentState.vitality,
                  correto: newVitality
                });
                set({ vitality: newVitality });
              }
            }).catch(err => {
              console.error('[AddXP] ❌ Erro ao salvar no Supabase:', err);
            });
          } catch (error) {
            console.error('[AddXP] Erro ao preparar dados para Supabase:', error);
          }
        } else {
          console.warn('[AddXP] ⚠️ UserId não disponível, não salvando no Supabase');
        }
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
        
        set({
          vitality: vitalityValue,
          mood: newMood as 'happy' | 'neutral' | 'tired' | 'sad'
        });
        
        // Atualizar PixelBuddy com nova vitalidade
        updatePixelBuddyState(state.xp, vitalityValue, newMood);
      },

      // Função para sincronizar dados do Supabase
      syncFromSupabase: (data: any) => {
        if (!data) {
          console.warn('[Gamification] syncFromSupabase: dados vazios');
          return;
        }
        
        const currentState = get();
        
        console.log('[Gamification] Sincronizando dados do Supabase:', {
          local: { xp: currentState.xp, coins: currentState.coins },
          supabase: { xp: data.xp, coins: data.coins }
        });
        
        // Sincronização normal se dados do Supabase parecem válidos
        const newRank = calcRank(data.xp);
        const newAttrs = calcAttributes(data.history || [], data.config || defaultConfig);
        const newAspect = calcAspect(newAttrs);
        
        const syncedXp = data.xp || 0;
        const syncedCoins = data.coins || 0;
        
        // 🧠 INTELIGÊNCIA DE VITALIDADE: Não sobrescrever se foi recalculada recentemente
        let syncedVitality = data.vitality || currentState.vitality;
        
        // 🛡️ VERIFICAR PROTEÇÃO DE VITALIDADE (prioridade máxima)
        const protectionData = localStorage.getItem('dl-vitality-protection');
        if (protectionData) {
          try {
            const protection = JSON.parse(protectionData);
            const timeSinceProtection = Date.now() - (protection.timestamp || 0);
            
            if (timeSinceProtection < 15000 && protection.protected) {
              // Proteção ativa - manter vitalidade protegida
              syncedVitality = protection.vitality;
              console.log('[SyncFromSupabase] 🛡️ PROTEÇÃO ATIVA - Mantendo vitalidade protegida:', {
                supabaseVitality: data.vitality,
                protectedVitality: protection.vitality,
                timeSinceProtection: `${timeSinceProtection}ms`
              });
              
              // Se passou de 15 segundos, remover proteção
              if (timeSinceProtection >= 15000) {
                localStorage.removeItem('dl-vitality-protection');
                console.log('[SyncFromSupabase] 🛡️ Proteção expirada, removendo...');
              }
              
              // Continuar com a sincronização usando a vitalidade protegida
            } else {
              // Proteção expirada ou inativa, usar lógica de fallback
              const localStorage_data = localStorage.getItem('dl-quick-stats');
              if (localStorage_data) {
                try {
                  const quickSave = JSON.parse(localStorage_data);
                  const timeSinceUpdate = Date.now() - (quickSave.lastUpdated || 0);
                  
                  if (timeSinceUpdate < 10000 && quickSave.vitality > data.vitality) {
                    // Se foi atualizada recentemente e é maior que a do Supabase, manter a local
                    syncedVitality = quickSave.vitality;
                    console.log('[SyncFromSupabase] 🧠 Mantendo vitalidade local recente:', {
                      supabaseVitality: data.vitality,
                      localVitality: quickSave.vitality,
                      timeSinceUpdate: `${timeSinceUpdate}ms`
                    });
                  } else {
                    syncedVitality = data.vitality || currentState.vitality;
                    console.log('[SyncFromSupabase] 📥 Usando vitalidade do Supabase:', {
                      supabaseVitality: data.vitality,
                      timeSinceUpdate: `${timeSinceUpdate}ms`
                    });
                  }
                } catch (error) {
                  console.error('[SyncFromSupabase] Erro ao verificar localStorage:', error);
                  syncedVitality = data.vitality || currentState.vitality;
                }
              }
            }
          } catch (error) {
            console.error('[SyncFromSupabase] Erro ao verificar proteção:', error);
          }
        }

        set({
          userId: data.userId || currentState.userId,
          xp: syncedXp,
          coins: syncedCoins,
          xp30d: data.xp30d || 0,
          vitality: syncedVitality,
          mood: getMoodFromVitality(syncedVitality) as 'happy' | 'neutral' | 'tired' | 'sad',
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

        // CRÍTICO: Atualizar localStorage com dados do Supabase
        try {
          const quickSave = {
            xp: syncedXp,
            coins: syncedCoins,
            vitality: syncedVitality,
            rankIdx: newRank.idx,
            rankTier: newRank.tier,
            rankDiv: newRank.div,
            lastUpdated: Date.now()
          };
          localStorage.setItem('dl-quick-stats', JSON.stringify(quickSave));
          console.log('[SyncFromSupabase] 💾 Dados atualizados no localStorage:', quickSave);
        } catch (error) {
          console.error('[SyncFromSupabase] Erro ao salvar no localStorage:', error);
        }
      },

      setConfig: (cfg: Partial<GamificationConfig>) => {
        set({ config: { ...get().config, ...cfg } });
      },

      setUserId: (userId: string) => {
        set({ userId });
      },

      // CRÍTICO: Função para descontar moedas (compras na loja)
      spendCoins: async (amount: number) => {
        const state = get();
        if (state.coins < amount) {
          console.warn('[SpendCoins] Moedas insuficientes:', { current: state.coins, needed: amount });
          return false;
        }

        const newCoins = state.coins - amount;
        console.log('[SpendCoins] Descontando moedas:', { before: state.coins, amount, after: newCoins });

        // Atualizar estado
        set({ coins: newCoins });

        // CRÍTICO: Salvar no localStorage imediatamente
        try {
          const quickSave = {
            xp: state.xp,
            coins: newCoins,
            vitality: state.vitality,
            rankIdx: state.rankIdx,
            rankTier: state.rankTier,
            rankDiv: state.rankDiv,
            lastUpdated: Date.now()
          };
          localStorage.setItem('dl-quick-stats', JSON.stringify(quickSave));
          console.log('[SpendCoins] 💾 Moedas atualizadas no localStorage:', quickSave);
        } catch (error) {
          console.error('[SpendCoins] Erro ao salvar no localStorage:', error);
        }

        // CRÍTICO: Salvar no Supabase
        if (state.userId && state.userId !== 'undefined') {
          try {
            await db.saveGamificationData({
              userId: state.userId,
              xp: state.xp,
              coins: newCoins,
              vitality: state.vitality,
              mood: state.mood,
              str: state.str,
              int: state.int,
              cre: state.cre,
              soc: state.soc,
              aspect: state.aspect,
              rankIdx: state.rankIdx,
              rankTier: state.rankTier,
              rankDiv: state.rankDiv,
              xpMultiplier: state.xpMultiplier,
              xpMultiplierExpiry: state.xpMultiplierExpiry,
              xp30d: state.xp30d
            });
            console.log('[SpendCoins] 💾 Moedas salvas no Supabase');
          } catch (error) {
            console.error('[SpendCoins] Erro ao salvar no Supabase:', error);
          }
        } else {
          console.warn('[SpendCoins] ⚠️ userId inválido, não salvando no Supabase:', state.userId);
        }

        return true;
      },

      // CRÍTICO: Função para adicionar moedas (vendas na loja)
      addCoins: async (amount: number) => {
        const state = get();
        const newCoins = state.coins + amount;
        console.log('[AddCoins] Adicionando moedas:', { before: state.coins, amount, after: newCoins });

        // Atualizar estado
        set({ coins: newCoins });

        // CRÍTICO: Salvar no localStorage imediatamente
        try {
          const quickSave = {
            xp: state.xp,
            coins: newCoins,
            vitality: state.vitality,
            rankIdx: state.rankIdx,
            rankTier: state.rankTier,
            rankDiv: state.rankDiv,
            lastUpdated: Date.now()
          };
          localStorage.setItem('dl-quick-stats', JSON.stringify(quickSave));
          console.log('[AddCoins] 💾 Moedas atualizadas no localStorage:', quickSave);
        } catch (error) {
          console.error('[AddCoins] Erro ao salvar no localStorage:', error);
        }

        // CRÍTICO: Salvar no Supabase
        if (state.userId && state.userId !== 'undefined') {
          try {
            await db.saveGamificationData({
              userId: state.userId,
              xp: state.xp,
              coins: newCoins,
              vitality: state.vitality,
              mood: state.mood,
              str: state.str,
              int: state.int,
              cre: state.cre,
              soc: state.soc,
              aspect: state.aspect,
              rankIdx: state.rankIdx,
              rankTier: state.rankTier,
              rankDiv: state.rankDiv,
              xpMultiplier: state.xpMultiplier,
              xpMultiplierExpiry: state.xpMultiplierExpiry,
              xp30d: state.xp30d
            });
            console.log('[AddCoins] 💾 Moedas salvas no Supabase');
          } catch (error) {
            console.error('[AddCoins] Erro ao salvar no Supabase:', error);
          }
        } else {
          console.warn('[AddCoins] ⚠️ userId inválido, não salvando no Supabase:', state.userId);
        }
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
        userId: state.userId,
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
    newHead = '/Nadr00J/heads/head_sad.png';
  } else if (vitality < 50) {
    newHead = '/Nadr00J/heads/head_tired.png';
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
  if (vitality < 25) return 'sad';
  if (vitality < 50) return 'tired';
  if (vitality < 75) return 'neutral';
  if (vitality < 90) return 'happy';
  return 'confident';
}
