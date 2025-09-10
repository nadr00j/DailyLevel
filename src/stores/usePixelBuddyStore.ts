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
        if (!userId) return;
        
        try {
          await dataSyncService.syncAll(userId);
          console.log('✅ [DEBUG] PixelBuddyStore - Estado sincronizado com Supabase');
        } catch (error) {
          console.error('❌ [DEBUG] PixelBuddyStore - Erro ao sincronizar com Supabase:', error);
        }
      }
    }),
    { name: 'dl.pixelbuddy.v1' }
  )
);
