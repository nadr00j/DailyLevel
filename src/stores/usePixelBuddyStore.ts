import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './useAuthStore';
import { dataSyncService } from '@/lib/DataSyncService';

export interface PixelBuddyItem {
  id: string;
  name: string;
  description: string;
  type: 'clothes' | 'accessory' | 'hat' | 'effect';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  price: number;
  unlocked: boolean;
  equipped: boolean;
  spritePath: string;
  unlockCondition?: string;
}

// Debug flag
const IS_DEBUG = false;

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
  syncToSupabase: () => Promise<void>;
  initializeFromGamification: (xp: number, vitality: number) => void;
}

// Função para obter o caminho base do usuário
function getUserAssetPath(username: string | null): string {
  return username ? `/${username}` : '/Nadr00J';
}

export const usePixelBuddyStore = create<PixelBuddyState>()(
  persist(
    (set, get) => ({
      body: '/Nadr00J/bodies/body_lvl1.png',
      head: '/Nadr00J/heads/head_neutral.png',
      clothes: null,
      accessory: null,
      hat: null,
      effect: null,
      inventory: {},

      setBase: (layer, spritePath) => {
        console.log(`[PixelBuddyStore] Atualizando ${layer}:`, spritePath);
        set({ [layer]: spritePath });
        // Sincronizar automaticamente
        get().syncToSupabase();
      },

      equipItem: (itemId) => {
        const { inventory } = get();
        const item = inventory[itemId];
        if (!item || !item.unlocked) return;

        // Desequipar quaisquer outros itens do mesmo tipo
        const updatedInventory: Record<string, PixelBuddyItem> = {};
        for (const [id, invItem] of Object.entries(inventory)) {
          if (invItem.type === item.type && invItem.equipped) {
            updatedInventory[id] = { ...invItem, equipped: false };
          } else {
            updatedInventory[id] = invItem;
          }
        }

        // Equipar o item selecionado
        updatedInventory[itemId] = { ...item, equipped: true };

        // Atualizar layer correspondente e inventário
        set({
          [item.type]: item.spritePath,
          inventory: updatedInventory
        });
        
        // Sincronizar automaticamente
        get().syncToSupabase();
      },

      unequipItem: (layer) => {
        set((state) => {
          // remover do layer e atualizar inventário
          const inventory = { ...state.inventory };
          // encontrar item equipado deste layer
          const idToUnequip = Object.entries(inventory).find(([, item]) => item.type === layer && item.equipped)?.[0];
          if (idToUnequip) {
            inventory[idToUnequip] = { ...inventory[idToUnequip], equipped: false };
          }
          return { [layer]: null, inventory };
        });
        
        // Sincronizar automaticamente
        get().syncToSupabase();
      },

      unlockItem: (item) => {
        set((state) => ({
          inventory: {
            ...state.inventory,
            [item.id]: { ...item, unlocked: true, equipped: false }
          }
        }));
        
        // Sincronizar automaticamente
        get().syncToSupabase();
      },

      syncToSupabase: async () => {
        const userId = useAuthStore.getState().user?.id;
        if (!userId || userId === 'undefined') {
          console.warn('⚠️ [PixelBuddyStore] syncToSupabase cancelado - userId inválido:', userId);
          return;
        }
        
        try {
          // 🚨 CRÍTICO: Pular gamificação para evitar sobrescrever vitalidade recalculada
          await dataSyncService.syncAll(userId, true); // skipGamification = true
          if (IS_DEBUG) console.log('✅ [DEBUG] PixelBuddyStore - Estado sincronizado com Supabase (sem gamificação)');
        } catch (error) {
          console.error('❌ [DEBUG] PixelBuddyStore - Erro ao sincronizar com Supabase:', error);
        }
      },

      initializeFromGamification: (xp: number, vitality: number) => {
        // Função para determinar o corpo baseado no XP
        const getBodyFromXp = (xp: number): string => {
          if (xp < 200) return '/Nadr00J/bodies/body_lvl1.png';
          if (xp < 600) return '/Nadr00J/bodies/body_lvl2.png';
          return '/Nadr00J/bodies/body_lvl3.png';
        };

        // Função para determinar a cabeça baseada na vitalidade
        const getHeadFromVitality = (vitality: number): string => {
          if (vitality < 25) return '/Nadr00J/heads/head_sad.png';
          if (vitality < 50) return '/Nadr00J/heads/head_tired.png';
          if (vitality < 75) return '/Nadr00J/heads/head_neutral.png';
          if (vitality < 90) return '/Nadr00J/heads/head_happy.png';
          return '/Nadr00J/heads/head_confident.png';
        };

        const newBody = getBodyFromXp(xp);
        const newHead = getHeadFromVitality(vitality);

        if (IS_DEBUG) console.log('[PixelBuddyStore] Inicializando com:', { xp, vitality, newBody, newHead });

        set({
          body: newBody,
          head: newHead
        });
        
        // Sincronizar automaticamente após inicialização
        get().syncToSupabase();
      }
    }),
    { name: 'dl.pixelbuddy.v1' }
  )
);
