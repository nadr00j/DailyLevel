import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useShopStore } from '@/stores/useShopStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { db } from '@/lib/database';
import { storage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { dataSyncService } from '@/lib/DataSyncService';

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

  // Função debounced para sincronização
  const debouncedSync = debounce(syncToSupabase, 2000); // 2 segundos de delay

  // Assina mudanças no store de gamificação para auto-sync
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const store = useGamificationStore;
    let prev = { xp: store.getState().xp, coins: store.getState().coins };
    const unsubscribe = store.subscribe((state) => {
      if (state.xp !== prev.xp || state.coins !== prev.coins) {
        prev = { xp: state.xp, coins: state.coins };
        debouncedSync(user.id);
      }
    });
    return unsubscribe;
  }, [isAuthenticated, user, debouncedSync]);

  // Monitorar mudanças no store da loja
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Aguardar um pouco para garantir que a conexão com Supabase esteja estabelecida
    const initialDelay = setTimeout(() => {
      const unsubscribe = useShopStore.subscribe(
        (state) => {
          // Sincronizar quando houver mudanças
          debouncedSync(user.id);
        }
      );

      return unsubscribe;
    }, 3000); // 3 segundos de delay inicial

    return () => clearTimeout(initialDelay);
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
    // Sincronizar sempre que houver mudança no store de hábitos (logs ou outros)
    const unsubscribe = useHabitStore.subscribe((state) => {
      debouncedSync(user.id);
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

  // Polling para sincronizar tarefas e metas (captura operações em storage)
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const interval = setInterval(() => {
      console.log('⏱️ Polling Auto-sync para garantir sincronização de tasks/goals...');
      debouncedSync(user.id);
    }, 10000); // a cada 10 segundos
    return () => clearInterval(interval);
  }, [isAuthenticated, user, debouncedSync]);

  return {
    syncToSupabase: (userId: string) => debouncedSync(userId)
  };
}
