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

import { useAuthStore } from '@/stores/useAuthStore';
import { dataSyncService } from '@/lib/DataSyncService';
import { generateId } from '@/lib/uuid';
import { db } from '@/lib/database';

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
      attrs.str += cat.str || 0;
      attrs.int += cat.int || 0;
      attrs.cre += cat.cre || 0;
      attrs.soc += cat.soc || 0;
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
      vitality: 50, // Será gerenciado pelo sistema V2.1
      mood: 'neutral' as const, // Será gerenciado pelo sistema V2.1
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
        const cfg = state.config;
        const category = resolveCategory(tags, cfg);
        
        // Calcular XP baseado no tipo e categoria
        let xpGained = cfg.points[type] || 10;
        
        // Aplicar multiplicador se ativo
        if (state.xpMultiplier > 1 && Date.now() < state.xpMultiplierExpiry) {
          xpGained = Math.floor(xpGained * state.xpMultiplier);
        }
        
        // Calcular moedas (10% do XP)
        const coinsGained = Math.floor(xpGained * 0.1);
        
        // Criar entrada no histórico
        const historyEntry = {
          id: generateId(),
          type,
          category,
          tags: tags || [],
          xp: xpGained,
          coins: coinsGained,
          ts: Date.now()
        };
        
        // Atualizar estado
        const newXp = state.xp + xpGained;
        const newCoins = state.coins + coinsGained;
        const newHistory = [...state.history, historyEntry];
        const newXp30d = rollingSum(newHistory);
        const newRank = calcRank(newXp);
        const newAttrs = calcAttributes(newHistory, cfg);
        const newAspect = calcAspect(newAttrs);
        
        set({
          xp: newXp,
          coins: newCoins,
          xp30d: newXp30d,
          str: newAttrs.str,
          int: newAttrs.int,
          cre: newAttrs.cre,
          soc: newAttrs.soc,
          aspect: newAspect,
          rankIdx: newRank.idx,
          rankTier: newRank.tier,
          rankDiv: newRank.div,
          history: newHistory
        });
        
        // Sincronizar com Supabase
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          // Salvar item de histórico no Supabase
          db.addHistoryItem(userId, historyEntry)
            .catch(err => console.error('[AddXP] Erro ao salvar histórico no Supabase:', err));
          
          // Sincronizar outros dados
          dataSyncService.syncAll(userId);
        }
        
        // TODO: Verificar promoção de rank quando necessário
        
        console.log('[AddXP Debug] XP adicionado:', { xpGained, newXp, newCoins });
      },

      setXpMultiplier: (multiplier: number, duration: number) => {
        set({
          xpMultiplier: multiplier,
          xpMultiplierExpiry: Date.now() + duration
        });
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


      init: async () => {
        // Carregar dados do Supabase na inicialização
        const userId = useAuthStore.getState().user?.id;
        if (userId) {
          try {
            await dataSyncService.loadAll(userId);
            console.log('[Gamification V2.1] Dados carregados do Supabase');
          } catch (error) {
            console.error('[Gamification V2.1] Erro ao carregar dados:', error);
          }
        }
        console.log('[Gamification V2.1] Store inicializado');
      }
    }),
    {
      name: 'dl.gamification.v21',
      storage,
      partialize: (state) => ({
        xp: state.xp,
        coins: state.coins,
        xp30d: state.xp30d,
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
          // Recalcular atributos e rank baseado no histórico
          const cfg = defaultConfig;
          const newRank = calcRank(state.xp);
          const newAttrs = calcAttributes(state.history || [], cfg);
          const newAspect = calcAspect(newAttrs);
          
          state.xp30d = rollingSum(state.history || []);
          state.str = newAttrs.str;
          state.int = newAttrs.int;
          state.cre = newAttrs.cre;
          state.soc = newAttrs.soc;
          state.aspect = newAspect;
          state.rankIdx = newRank.idx;
          state.rankTier = newRank.tier;
          state.rankDiv = newRank.div;
          state.config = cfg;
          
          console.log('[Gamification V2.1] Store reidratado com dados locais:', {
            xp: state.xp,
            rank: `${state.rankTier} ${state.rankDiv}`,
            aspect: state.aspect
          });
        }
      }
    }
  )
);
