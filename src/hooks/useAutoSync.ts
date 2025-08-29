import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useShopStore } from '@/stores/useShopStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { db } from '@/lib/database';
import { storage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

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
      console.log('🔍 [DEBUG] syncToSupabase iniciado para userId:', userId);
      
      // Verificar conectividade antes de sincronizar
      const isConnected = await checkSupabaseConnection();
      if (!isConnected) {
        console.log('⏳ Auto-sync: Aguardando conexão com Supabase...');
        return;
      }

      console.log('🔄 Auto-sync: Sincronizando dados para o Supabase...');
      
      // 1. Sincronizar dados de gamificação
      const gamificationState = useGamificationStore.getState();
      await db.saveGamificationData({
        userId,
        xp: gamificationState.xp,
        coins: gamificationState.coins,
        xp30d: gamificationState.xp30d,
        vitality: gamificationState.vitality,
        mood: gamificationState.mood,
        xpMultiplier: gamificationState.xpMultiplier,
        xpMultiplierExpiry: gamificationState.xpMultiplierExpiry,
        str: gamificationState.str,
        int: gamificationState.int,
        cre: gamificationState.cre,
        soc: gamificationState.soc,
        aspect: gamificationState.aspect,
        rankIdx: gamificationState.rankIdx,
        rankTier: gamificationState.rankTier,
        rankDiv: gamificationState.rankDiv
      });

      // 2. Sincronizar configurações do usuário
      const shopState = useShopStore.getState();
      await db.saveUserSettings({
        userId,
        confettiEnabled: shopState.confettiEnabled,
        gamificationConfig: {}
      });

      // 3. Sincronizar tarefas
      const tasks = await storage.getTasks();
      for (const task of tasks) {
        await db.saveTask(userId, task);
      }

      // 4. Sincronizar hábitos do store Zustand
      const habitStoreState = useHabitStore.getState();
      const zustandHabits = Object.values(habitStoreState.habits);
      console.log('🔍 [DEBUG] Hábitos no Zustand store:', zustandHabits.length, zustandHabits);
      
      for (const habit of zustandHabits) {
        console.log('🔍 [DEBUG] Sincronizando hábito:', habit.id, habit.name, {
          color: habit.color,
          iconType: habit.iconType,
          iconValue: habit.iconValue,
          categories: habit.categories,
          targetCount: habit.targetCount,
          targetInterval: habit.targetInterval,
          activeDays: habit.activeDays,
          order: habit.order,
          description: habit.description
        });
        
        // Converter do formato Zustand para o formato do banco
        const dbHabit = {
          id: habit.id,
          title: habit.name,
          description: habit.description || '',
          color: habit.color || '#3B82F6',
          icon_type: habit.iconType || 'emoji',
          icon_value: habit.iconValue || '📝',
          categories: habit.categories || [],
          frequency: habit.targetInterval === 'daily' ? 'daily' : 'weekly',
          target_days: habit.activeDays || [0,1,2,3,4,5,6],
          target_count: habit.targetCount || 1,
          order_index: habit.order || 0,
          streak: 0,
          longest_streak: 0,
          is_active: true,
          created_at: habit.createdAt,
          updated_at: new Date().toISOString()
        };
        
        console.log('🔍 [DEBUG] Dados do hábito para o banco:', dbHabit);
        
        try {
          const result = await db.saveHabit(userId, dbHabit as any);
          console.log('✅ [DEBUG] Hábito salvo com sucesso:', result);
        } catch (error) {
          console.error('❌ [DEBUG] Erro ao salvar hábito:', error);
        }
      }

      // 5. Sincronizar metas
      const goals = await storage.getGoals();
      for (const goal of goals) {
        await db.saveGoal(userId, goal);
      }

      console.log('✅ Auto-sync: Dados sincronizados com sucesso!');
      
    } catch (error) {
      console.error('❌ Auto-sync: Erro ao sincronizar:', error);
    }
  };

  // Função debounced para sincronização
  const debouncedSync = debounce(syncToSupabase, 2000); // 2 segundos de delay

  // Monitorar mudanças no store de gamificação
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Aguardar um pouco para garantir que a conexão com Supabase esteja estabelecida
    const initialDelay = setTimeout(() => {
      const unsubscribe = useGamificationStore.subscribe(
        (state) => {
          // Sincronizar quando houver mudanças
          debouncedSync(user.id);
        }
      );

      return unsubscribe;
    }, 3000); // 3 segundos de delay inicial

    return () => clearTimeout(initialDelay);
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

  // Monitorar mudanças no store de hábitos
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Aguardar um pouco para garantir que a conexão com Supabase esteja estabelecida
    const initialDelay = setTimeout(() => {
      const unsubscribe = useHabitStore.subscribe(
        (state) => {
          console.log('🔍 [DEBUG] useHabitStore mudou, disparando sync:', state.habits);
          // Sincronizar quando houver mudanças
          debouncedSync(user.id);
        }
      );

      return unsubscribe;
    }, 3000); // 3 segundos de delay inicial

    return () => clearTimeout(initialDelay);
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

  return {
    syncToSupabase: (userId: string) => debouncedSync(userId)
  };
}
