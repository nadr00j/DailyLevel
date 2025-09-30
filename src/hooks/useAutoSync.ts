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

  // Função para verificar conectividade com Supabase
  const checkSupabaseConnection = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.from('profiles').select('id').limit(1);
      return !error;
    } catch {
      return false;
    }
  };

  // Função para sincronizar dados para o Supabase
  const syncToSupabase = async (userId: string) => {
    try {
      const online = await checkSupabaseConnection();
      if (!online) {
        console.warn('Auto-sync: Sem conexão com Supabase, pulando sync.');
        return;
      }
      console.log('🔄 Auto-sync: Sincronizando todos os dados via DataSyncService...');
      await dataSyncService.syncAll(userId);
      console.log('✅ Auto-sync: Dados sincronizados com sucesso!');
    } catch (error) {
      console.error('❌ Auto-sync: Erro ao sincronizar dados via DataSyncService:', error);
    }
  };

  // Função debounced para sincronização - REDUZIDO para sincronização mais rápida
  const debouncedSync = debounce(syncToSupabase, 500); // 500ms de delay

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
        state.vitality !== prev.vitality ||
        state.history.length !== prev.historyLength
      );
      
      if (hasChanges) {
        console.log('🔄 [AutoSync] Mudança detectada no store de gamificação:', {
          xp: `${prev.xp} → ${state.xp}`,
          coins: `${prev.coins} → ${state.coins}`,
          historyLength: `${prev.historyLength} → ${state.history.length}`
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
  }, [isAuthenticated, user, debouncedSync]);

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
  }, [isAuthenticated, user, debouncedSync]);

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
  }, [isAuthenticated, user, debouncedSync]);

  // Monitorar mudanças nos logs de hábitos para sincronizar incrementos parciais
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const store = useHabitStore;
    let prevLogs = store.getState().logs;
    
    const unsubscribe = store.subscribe((state) => {
      // Sincronizar apenas quando logs mudarem (conclusões de hábitos)
      if (JSON.stringify(state.logs) !== JSON.stringify(prevLogs)) {
        prevLogs = state.logs;
        debouncedSync(user.id);
      }
    });
    return unsubscribe;
  }, [isAuthenticated, user, debouncedSync]);

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
  }, [isAuthenticated, user, debouncedSync]);

  // Monitorar mudanças no store de metas para auto-sync
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const store = useGoalStore;
    let prevGoals = store.getState().goals;
    
    const unsubscribe = store.subscribe((state) => {
      // Sincronizar apenas quando metas mudarem
      if (JSON.stringify(state.goals) !== JSON.stringify(prevGoals)) {
        console.log('🔍 [DEBUG] useAutoSync - Metas mudaram, sincronizando...', state.goals.length);
        prevGoals = state.goals;
        debouncedSync(user.id);
      }
    });
    return unsubscribe;
  }, [isAuthenticated, user, debouncedSync]);

  return {
    syncToSupabase: (userId: string) => debouncedSync(userId)
  };
}
