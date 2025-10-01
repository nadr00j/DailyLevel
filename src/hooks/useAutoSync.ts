import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useGamificationStoreV21 } from '@/stores/useGamificationStoreV21';
import { useShopStore } from '@/stores/useShopStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { db } from '@/lib/database';
import { storage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { dataSyncService } from '@/lib/DataSyncService';
import { useTaskStore } from '@/stores/useTaskStore';
import { useGoalStore } from '@/stores/useGoalStore';

// Debounce function
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

export function useAutoSync() {
  const { user, isAuthenticated } = useAuthStore();
  const syncTimeoutRef = useRef<NodeJS.Timeout>();
  const isSyncingRef = useRef(false);

  // Função para verificar conectividade com Supabase
  const checkSupabaseConnection = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  };

  // Função para sincronizar dados para o Supabase - com proteção contra loops
  const syncToSupabase = async (userId: string) => {
    if (isSyncingRef.current) {
      console.log('🔍 [SYNC DEBUG] ⚠️ Já está sincronizando, pulando...', {
        userId,
        timestamp: Date.now(),
        stack: new Error().stack?.split('\n').slice(1, 4)
      });
      return;
    }
    
    try {
      isSyncingRef.current = true;
      console.log('🔍 [SYNC DEBUG] 🔄 Iniciando sincronização:', {
        userId,
        timestamp: Date.now(),
        stack: new Error().stack?.split('\n').slice(1, 4)
      });
      
      const online = await checkSupabaseConnection();
      if (!online) {
        console.warn('🔍 [SYNC DEBUG] ⚠️ Sem conexão com Supabase, pulando sync.');
        return;
      }
      
      console.log('🔍 [SYNC DEBUG] 🔄 Chamando dataSyncService.syncAll...');
      await dataSyncService.syncAll(userId);
      console.log('🔍 [SYNC DEBUG] ✅ Sincronização concluída!');
    } catch (error) {
      console.error('🔍 [SYNC DEBUG] ❌ Erro na sincronização:', error);
    } finally {
      isSyncingRef.current = false;
      console.log('🔍 [SYNC DEBUG] 🏁 Flag isSyncing resetada');
    }
  };

  // Função debounced para sincronização - AUMENTADO para evitar loops
  const debouncedSync = useRef(debounce(syncToSupabase, 2000)).current; // 2s de delay

  // Assina mudanças no store de gamificação para auto-sync
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const store = useGamificationStoreV21;
    let prev = { 
      xp: store.getState().xp, 
      coins: store.getState().coins,
      xp30d: store.getState().xp30d,
      vitality: store.getState().vitality,
      historyLength: store.getState().history.length
    };
    
    const unsubscribe = store.subscribe((state) => {
      const hasChanges = (
        state.xp !== prev.xp || 
        state.coins !== prev.coins ||
        state.xp30d !== prev.xp30d ||
        // TEMPORARIAMENTE REMOVIDO: state.vitality !== prev.vitality || // Causa loop infinito
        state.history.length !== prev.historyLength
      );
      
      if (hasChanges) {
        console.log('🔍 [AUTOSYNC DEBUG] Mudança detectada no store de gamificação:', {
          changes: {
            xp: `${prev.xp} → ${state.xp}`,
            coins: `${prev.coins} → ${state.coins}`,
            xp30d: `${prev.xp30d} → ${state.xp30d}`,
            vitality: `${prev.vitality} → ${state.vitality}`,
            historyLength: `${prev.historyLength} → ${state.history.length}`
          },
          timestamp: Date.now(),
          stack: new Error().stack?.split('\n').slice(1, 4)
        });
        
        prev = { 
          xp: state.xp, 
          coins: state.coins,
          xp30d: state.xp30d,
          vitality: state.vitality,
          historyLength: state.history.length
        };
        debouncedSync(user.id);
      }
    });
    return unsubscribe;
  }, [isAuthenticated, user?.id]);

  // Monitorar mudanças no store da loja (apenas quando items são comprados/vendidos)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const store = useShopStore;
    let prevItems = store.getState().items;
    
    const unsubscribe = store.subscribe((state) => {
      // Verificar se algum item mudou de purchased
      const hasChanges = state.items.some((item, index) => {
        const prevItem = prevItems[index];
        return prevItem && prevItem.purchased !== item.purchased;
      });
      
      if (hasChanges) {
        prevItems = state.items;
        debouncedSync(user.id);
      }
    });

    return unsubscribe;
  }, [isAuthenticated, user?.id]); // CORRIGIDO: Removido debouncedSync das dependências

  // Assina mudanças no store de hábitos para auto-sync
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const store = useHabitStore;
    let prevLogs = store.getState().logs;
    const unsubscribe = store.subscribe((state) => {
      if (JSON.stringify(state.logs) !== JSON.stringify(prevLogs)) {
        prevLogs = state.logs;
        debouncedSync(user.id);
      }
    });
    return unsubscribe;
  }, [isAuthenticated, user?.id]);

  // Sincronizar antes de sair da página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isAuthenticated && user) {
        // Sincronização síncrona antes de sair
        syncToSupabase(user.id);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAuthenticated, user]);

  // Polling removido - agora sincronizamos apenas quando há mudanças reais

  // Monitorar mudanças no store de tarefas para auto-sync
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const store = useTaskStore;
    let prevTasks = store.getState().tasks;
    
    const unsubscribe = store.subscribe((state) => {
      // Sincronizar apenas quando tarefas mudarem
      if (JSON.stringify(state.tasks) !== JSON.stringify(prevTasks)) {
        prevTasks = state.tasks;
        debouncedSync(user.id);
      }
    });
    return unsubscribe;
  }, [isAuthenticated, user?.id]);

  // Monitorar mudanças no store de metas para auto-sync
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const store = useGoalStore;
    let prevGoals = store.getState().goals;
    
    const unsubscribe = store.subscribe((state) => {
      // Sincronizar apenas quando metas mudarem
      if (JSON.stringify(state.goals) !== JSON.stringify(prevGoals)) {
        // Reduzido log para evitar spam
        // console.log('🔍 [DEBUG] useAutoSync - Metas mudaram, sincronizando...', state.goals.length);
        prevGoals = state.goals;
        debouncedSync(user.id);
      }
    });
    return unsubscribe;
  }, [isAuthenticated, user?.id]);

  return {
    syncToSupabase: (userId: string) => debouncedSync(userId)
  };
}
