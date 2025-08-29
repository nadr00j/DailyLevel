import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
      },

      equipItem: (itemId) => {
        const { inventory } = get();
        const item = inventory[itemId];
        if (!item || !item.unlocked) return;

        // desequipar anterior do mesmo tipo
        set((state) => {
          const updates: Partial<PixelBuddyState> = {};
          if (item.type === 'clothes') updates.clothes = item.spritePath;
          if (item.type === 'accessory') updates.accessory = item.spritePath;
          if (item.type === 'hat') updates.hat = item.spritePath;
          if (item.type === 'effect') updates.effect = item.spritePath;
          return updates;
        });

        // marcar como equipado
        set((state) => ({
          inventory: {
            ...state.inventory,
            [itemId]: { ...item, equipped: true }
          }
        }));
      },

      unequipItem: (layer) => {
        set({ [layer]: null });
      },

      unlockItem: (item) => {
        set((state) => ({
          inventory: {
            ...state.inventory,
            [item.id]: { ...item, unlocked: true, equipped: false }
          }
        }));
      }
    }),
    { name: 'dl.pixelbuddy.v1' }
  )
);
