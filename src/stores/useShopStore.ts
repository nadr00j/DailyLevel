import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { usePixelBuddyStore } from '@/stores/usePixelBuddyStore';
import { fireGoldenConfetti } from '@/lib/confetti';

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: 'cosmetic' | 'vantagens' | 'special';
  icon: string;
  purchased: boolean;
  pixelBuddyData?: {
    type: 'clothes' | 'accessory' | 'hat' | 'effect';
    spritePath: string;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  };
}

interface ShopState {
  open: boolean;
  items: ShopItem[];
  sellConfirmation: { open: boolean; item: ShopItem | null; sellPrice: number };
  confettiEnabled: boolean;
  
  openShop: () => void;
  closeShop: () => void;
  toggleConfetti: () => void;
  setConfettiEnabled: (enabled: boolean) => void;
  openSellConfirmation: (item: ShopItem) => void;
  closeSellConfirmation: () => void;
  buyItem: (itemId: string) => boolean;
  sellItem: (itemId: string) => boolean;
  setItems: (items: ShopItem[]) => void;
  removeItem: (itemId: string) => void;
  cleanupUnwantedItems: () => void;
  resetShop: () => void;
  clearShopCache: () => Promise<void>;
}

const defaultItems: ShopItem[] = [
  // === VANTAGENS ===
  {
    id: 'xp_boost_1',
    name: 'Boost de XP',
    description: 'Ganha 50% mais XP por 1 hora',
    price: 50,
    category: 'vantagens',
    icon: '⚡',
    purchased: false
  },
  {
    id: 'vitality_boost',
    name: 'Vitalidade Extra',
    description: 'Recupera 50% da vitalidade',
    price: 30,
    category: 'vantagens',
    icon: '❤️',
    purchased: false
  },
  {
    id: 'confetti_effect',
    name: 'Efeito Confete',
    description: 'Confete dourado ao completar tarefas',
    price: 75,
    category: 'vantagens',
    icon: '🎉',
    purchased: false,
    pixelBuddyData: {
      type: 'effect',
      spritePath: '/Nadr00J/effects/effect_confetti.png',
      rarity: 'rare'
    }
  },

  // === ROUPAS ===
  {
    id: 'clothes_tshirt',
    name: 'Camiseta Básica',
    description: 'Uma camiseta confortável para o dia a dia',
    price: 25,
    category: 'cosmetic',
    icon: '/Nadr00J/clothes/clothes_tshirt.png',
    purchased: false,
    pixelBuddyData: {
      type: 'clothes',
      spritePath: '/Nadr00J/clothes/clothes_tshirt.png',
      rarity: 'common'
    }
  },
  {
    id: 'clothes_hoodie',
    name: 'Moletom',
    description: 'Moletom quentinho para dias frios',
    price: 40,
    category: 'cosmetic',
    icon: '/Nadr00J/clothes/clothes_hoodie.png',
    purchased: false,
    pixelBuddyData: {
      type: 'clothes',
      spritePath: '/Nadr00J/clothes/clothes_hoodie.png',
      rarity: 'common'
    }
  },
  {
    id: 'clothes_jacket',
    name: 'Jaqueta',
    description: 'Jaqueta estilosa para qualquer ocasião',
    price: 55,
    category: 'cosmetic',
    icon: '/Nadr00J/clothes/clothes_jacket.png',
    purchased: false,
    pixelBuddyData: {
      type: 'clothes',
      spritePath: '/Nadr00J/clothes/clothes_jacket.png',
      rarity: 'rare'
    }
  },
  {
    id: 'clothes_regata',
    name: 'Regata',
    description: 'Regata para dias de treino',
    price: 20,
    category: 'cosmetic',
    icon: '/Nadr00J/clothes/clothes_regata.png',
    purchased: false,
    pixelBuddyData: {
      type: 'clothes',
      spritePath: '/Nadr00J/clothes/clothes_regata.png',
      rarity: 'common'
    }
  },
  {
    id: 'clothes_suit',
    name: 'Terno',
    description: 'Terno elegante para ocasiões especiais',
    price: 100,
    category: 'cosmetic',
    icon: '/Nadr00J/clothes/clothes_suit.png',
    purchased: false,
    pixelBuddyData: {
      type: 'clothes',
      spritePath: '/Nadr00J/clothes/clothes_suit.png',
      rarity: 'epic'
    }
  },

  // === CHAPÉUS ===
  {
    id: 'hat_cap',
    name: 'Boné Esportivo',
    description: 'Boné para dias de atividade física',
    price: 35,
    category: 'cosmetic',
    icon: '/Nadr00J/hats/hat_cap.png',
    purchased: false,
    pixelBuddyData: {
      type: 'hat',
      spritePath: '/Nadr00J/hats/hat_cap.png',
      rarity: 'common'
    }
  },
  {
    id: 'hat_beanie',
    name: 'Gorro de Inverno',
    description: 'Gorro quentinho para o inverno',
    price: 30,
    category: 'cosmetic',
    icon: '/Nadr00J/hats/hat_beanie.png',
    purchased: false,
    pixelBuddyData: {
      type: 'hat',
      spritePath: '/Nadr00J/hats/hat_beanie.png',
      rarity: 'common'
    }
  },
  {
    id: 'hat_cowboy',
    name: 'Chapéu de Cowboy',
    description: 'Chapéu de cowboy para um visual único',
    price: 60,
    category: 'cosmetic',
    icon: '/Nadr00J/hats/hat_cowboy.png',
    purchased: false,
    pixelBuddyData: {
      type: 'hat',
      spritePath: '/Nadr00J/hats/hat_cowboy.png',
      rarity: 'rare'
    }
  },
  {
    id: 'hat_top_hat',
    name: 'Cartola',
    description: 'Cartola elegante para ocasiões formais',
    price: 80,
    category: 'cosmetic',
    icon: '/Nadr00J/hats/hat_top_hat.png',
    purchased: false,
    pixelBuddyData: {
      type: 'hat',
      spritePath: '/Nadr00J/hats/hat_top_hat.png',
      rarity: 'epic'
    }
  },

  // === ACESSÓRIOS ===
  {
    id: 'accessory_glasses',
    name: 'Óculos Inteligente',
    description: 'Óculos que aumentam a inteligência',
    price: 60,
    category: 'cosmetic',
    icon: '/Nadr00J/acessories/accessory_glasses.png',
    purchased: false,
    pixelBuddyData: {
      type: 'accessory',
      spritePath: '/Nadr00J/acessories/accessory_glasses.png',
      rarity: 'rare'
    }
  },
  {
    id: 'accessory_mask',
    name: 'Máscara Misteriosa',
    description: 'Máscara que adiciona um toque de mistério',
    price: 45,
    category: 'cosmetic',
    icon: '/Nadr00J/acessories/accessory_mask.png',
    purchased: false,
    pixelBuddyData: {
      type: 'accessory',
      spritePath: '/Nadr00J/acessories/accessory_mask.png',
      rarity: 'rare'
    }
  }
];

const storage = createJSONStorage(() => ({
  getItem: async (name: string) => (await localforage.getItem<string>(name)) ?? null,
  setItem: async (name: string, value: string) => { await localforage.setItem(name, value); },
  removeItem: async (name: string) => { await localforage.removeItem(name); }
}));

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      open: false,
      items: defaultItems,
      sellConfirmation: { open: false, item: null, sellPrice: 0 },
      confettiEnabled: false,
      
      // Debug: Log initial state
      ...(() => {
        console.log('[Shop Debug] Initial confettiEnabled:', false);
        return {};
      })(),
      
      openShop: () => {
        // Limpar itens indesejados antes de abrir a loja
        const { cleanupUnwantedItems } = get();
        cleanupUnwantedItems();
        set({ open: true });
      },
      closeShop: () => set({ open: false }),
      
      toggleConfetti: () => {
        const { confettiEnabled } = get();
        console.log('[Shop Debug] Toggling confetti from:', confettiEnabled, 'to:', !confettiEnabled);
        set({ confettiEnabled: !confettiEnabled });
      },
      
      setConfettiEnabled: (enabled: boolean) => {
        console.log('[Shop Debug] Setting confetti to:', enabled);
        set({ confettiEnabled: enabled });
      },
      
      openSellConfirmation: (item: ShopItem) => {
        const sellPrice = Math.floor(item.price / 2);
        set({ sellConfirmation: { open: true, item, sellPrice } });
      },
      
      closeSellConfirmation: () => {
        set({ sellConfirmation: { open: false, item: null, sellPrice: 0 } });
      },
      
      buyItem: (itemId: string) => {
        const { items } = get();
        const item = items.find(i => i.id === itemId);
        if (!item || item.purchased) return false;
        
        const { coins } = useGamificationStore.getState();
        if (coins < item.price) return false;
        
        console.log('[Shop Debug] Buying item:', itemId);
        
        // Deduct coins using proper Zustand set
        useGamificationStore.setState({ coins: coins - item.price });
        
        // Apply item effects
        applyItemEffect(itemId);
        
        // Add to PixelBuddy inventory if it's a cosmetic item
        if (item.category === 'cosmetic' && item.pixelBuddyData) {
          const pixelBuddyStore = usePixelBuddyStore.getState();
          pixelBuddyStore.unlockItem({
            id: itemId,
            name: item.name,
            description: item.description,
            type: item.pixelBuddyData.type,
            rarity: item.pixelBuddyData.rarity || 'common',
            price: item.price,
            unlocked: true,
            equipped: false,
            spritePath: item.pixelBuddyData.spritePath
          });
        }
        
        set({
          items: items.map(i => 
            i.id === itemId ? { ...i, purchased: true } : i
          )
        });
        
        return true;
      },
      
      sellItem: (itemId: string) => {
        const { items } = get();
        const item = items.find(i => i.id === itemId);
        if (!item || !item.purchased) return false;
        
        // Calculate sell price (half of original price)
        const sellPrice = Math.floor(item.price / 2);
        
        // Add coins to user
        const { coins } = useGamificationStore.getState();
        useGamificationStore.setState({ coins: coins + sellPrice });
        
        // Remove item effects if applicable
        removeItemEffect(itemId);
        
        // Remove from PixelBuddy inventory if it's a cosmetic item
        if (item.category === 'cosmetic') {
          const pixelBuddyStore = usePixelBuddyStore.getState();
          // Remove from inventory (this would need to be implemented in the store)
          // For now, just unequip if equipped
          if (item.pixelBuddyData) {
            pixelBuddyStore.unequipItem(item.pixelBuddyData.type);
          }
        }
        
        set({
          items: items.map(i => 
            i.id === itemId ? { ...i, purchased: false } : i
          ),
          sellConfirmation: { open: false, item: null, sellPrice: 0 }
        });
        
        return true;
      },
      
      setItems: (items: ShopItem[]) => set({ items }),
      
      removeItem: (itemId: string) => {
        set(state => ({
          items: state.items.filter(item => item.id !== itemId)
        }));
      },
      
      cleanupUnwantedItems: () => {
        set(state => ({
          items: state.items.filter(item => 
            item.id !== 'dark_theme_premium' && 
            item.id !== 'tema_escuro_premium' &&
            item.name !== 'Tema Escuro Premium'
          )
        }));
      },
      resetShop: () => {
        set({ items: defaultItems });
        console.log('[Shop Debug] Shop reset to default items.');
      },
      
      // Função para limpar completamente o cache da loja
      clearShopCache: async () => {
        try {
          await localforage.removeItem('dl.shop.v1');
          console.log('[Shop Debug] Shop cache cleared from localforage.');
          // Reset para os itens padrão
          set({ items: defaultItems });
        } catch (error) {
          console.error('[Shop Debug] Error clearing shop cache:', error);
        }
      }
    }),
    {
      name: 'dl.shop.v1',
      storage,
      partialize: (s) => ({ items: s.items, confettiEnabled: s.confettiEnabled }),
      onRehydrateStorage: () => (state) => {
        console.log('[Shop Debug] Rehydrated state:', state);
        if (state?.items) {
          // Limpar itens indesejados ao rehydrate
          const unwantedItems = state.items.filter(item => 
            item.id === 'dark_theme_premium' || 
            item.id === 'tema_escuro_premium' ||
            item.name === 'Tema Escuro Premium'
          );
          
          if (unwantedItems.length > 0) {
            console.log('[Shop Debug] Removing unwanted items:', unwantedItems);
            state.items = state.items.filter(item => 
              item.id !== 'dark_theme_premium' && 
              item.id !== 'tema_escuro_premium' &&
              item.name !== 'Tema Escuro Premium'
            );
          }
          
          const confettiItem = state.items.find(item => item.id === 'confetti_effect');
          console.log('[Shop Debug] Confetti item:', confettiItem);
          
          // Auto-enable confetti if item is purchased but confetti is disabled
          if (confettiItem?.purchased && !state.confettiEnabled) {
            console.log('[Shop Debug] Auto-enabling confetti because item is purchased');
            // Use setTimeout to ensure the store is fully initialized
            setTimeout(() => {
              useShopStore.getState().setConfettiEnabled(true);
            }, 100);
          }
        }
      }
    }
  )
);

// Apply effects based on item type
function applyItemEffect(itemId: string) {
  switch (itemId) {
    case 'xp_boost_1':
      // Activate XP boost for 1 hour
      const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
      useGamificationStore.setState({
        xpMultiplier: 1.5,
        xpMultiplierExpiry: Date.now() + oneHour
      });
      break;
    case 'vitality_boost':
      // Restore 50% vitality
      const currentVitality = useGamificationStore.getState().vitality;
      const newVitality = Math.min(100, currentVitality + 50);
      useGamificationStore.setState({ vitality: newVitality });
      break;
    case 'confetti_effect':
      // Enable confetti effect
      console.log('[Shop Debug] Applying confetti effect');
      useShopStore.getState().setConfettiEnabled(true);
      // Fire initial confetti
      fireGoldenConfetti();
      break;
  }
}

// Remove effects based on item type
function removeItemEffect(itemId: string) {
  switch (itemId) {
    case 'xp_boost_1':
      // Remove XP boost
      useGamificationStore.setState({
        xpMultiplier: 1,
        xpMultiplierExpiry: 0
      });
      break;
    case 'vitality_boost':
      // Vitality boost is instant, no need to remove
      break;
    case 'confetti_effect':
      // Disable confetti effect
      useShopStore.getState().setConfettiEnabled(false);
      break;
  }
}
