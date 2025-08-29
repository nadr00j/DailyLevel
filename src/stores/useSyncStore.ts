import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import localforage from 'localforage';
import type { SyncState, Change, UserData, SyncConfig } from '@/types/sync';

const storage = createJSONStorage(() => ({
  getItem: async (name: string) => (await localforage.getItem<string>(name)) ?? null,
  setItem: async (name: string, value: string) => { await localforage.setItem(name, value); },
  removeItem: async (name: string) => { await localforage.removeItem(name); }
}));

interface SyncStore extends SyncState {
  config: SyncConfig;
  
  // Actions
  setOnline: (online: boolean) => void;
  addPendingChange: (change: Change) => void;
  clearPendingChanges: () => void;
  setLastSync: (timestamp: number) => void;
  setUserId: (userId: string) => void;
  updateConfig: (config: Partial<SyncConfig>) => void;
  
  // Sync operations
  syncData: () => Promise<void>;
  exportUserData: () => Promise<UserData>;
  importUserData: (data: UserData) => Promise<void>;
}

const defaultConfig: SyncConfig = {
  autoSync: true,
  syncInterval: 5, // 5 minutos
  enableOfflineMode: true
};

export const useSyncStore = create<SyncStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      isOnline: navigator.onLine,
      lastSync: 0,
      pendingChanges: [],
      userId: undefined,
      config: defaultConfig,

      // Actions
      setOnline: (online) => set({ isOnline: online }),
      addPendingChange: (change) => set((state) => ({
        pendingChanges: [...state.pendingChanges, change]
      })),
      clearPendingChanges: () => set({ pendingChanges: [] }),
      setLastSync: (timestamp) => set({ lastSync: timestamp }),
      setUserId: (userId) => set({ userId }),
      updateConfig: (newConfig) => set((state) => ({
        config: { ...state.config, ...newConfig }
      })),

      // Sync operations
      syncData: async () => {
        const state = get();
        if (!state.isOnline || state.pendingChanges.length === 0) return;

        try {
          // TODO: Implementar chamada para API
          console.log('[Sync] Sincronizando', state.pendingChanges.length, 'mudanças');
          
          // Simular sucesso
          set({ 
            pendingChanges: [],
            lastSync: Date.now()
          });
        } catch (error) {
          console.error('[Sync] Erro na sincronização:', error);
        }
      },

      exportUserData: async () => {
        // TODO: Implementar exportação de todos os dados
        const data: UserData = {
          userId: get().userId || 'anonymous',
          gamification: {},
          tasks: [],
          habits: [],
          goals: [],
          shop: {},
          lastSync: Date.now(),
          version: '1.0.0'
        };
        return data;
      },

      importUserData: async (data: UserData) => {
        // TODO: Implementar importação de dados
        console.log('[Sync] Importando dados do usuário:', data.userId);
      }
    }),
    {
      name: 'dl.sync.v1',
      storage,
      partialize: (s) => ({
        isOnline: s.isOnline,
        lastSync: s.lastSync,
        pendingChanges: s.pendingChanges,
        userId: s.userId,
        config: s.config
      })
    }
  )
);

// Listener para mudanças de conectividade
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useSyncStore.getState().setOnline(true);
    useSyncStore.getState().syncData();
  });
  
  window.addEventListener('offline', () => {
    useSyncStore.getState().setOnline(false);
  });
}
