import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useShopStore } from '@/stores/useShopStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { db } from '@/lib/database';
import { storage } from '@/lib/storage';

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

  // Função para sincronizar dados para o Supabase
  const syncToSupabase = async (userId: string) => {
    try {
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

      // 4. Sincronizar hábitos do storage simples
      const habits = await storage.getHabits();
      for (const habit of habits) {
        await db.saveHabit(userId, habit);
      }

      // 5. Sincronizar hábitos do store Zustand
      const habitStoreState = useHabitStore.getState();
      const zustandHabits = Object.values(habitStoreState.habits);
      for (const habit of zustandHabits) {
        // Converter do formato Zustand para o formato do banco
        const dbHabit = {
          id: habit.id,
          title: habit.name,
          description: habit.description || '',
          color: habit.color,
          frequency: habit.targetInterval,
          targetDays: habit.activeDays || [0,1,2,3,4,5,6],
          streak: 0,
          longestStreak: 0,
          isActive: true,
          createdAt: habit.createdAt,
          updatedAt: new Date().toISOString()
        };
        await db.saveHabit(userId, dbHabit as any);
      }

      // 6. Sincronizar metas
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

    const unsubscribe = useGamificationStore.subscribe(
      (state) => {
        // Sincronizar quando houver mudanças
        debouncedSync(user.id);
      }
    );

    return unsubscribe;
  }, [isAuthenticated, user, debouncedSync]);

  // Monitorar mudanças no store da loja
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const unsubscribe = useShopStore.subscribe(
      (state) => {
        // Sincronizar quando houver mudanças
        debouncedSync(user.id);
      }
    );

    return unsubscribe;
  }, [isAuthenticated, user, debouncedSync]);

  // Monitorar mudanças no store de hábitos
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const unsubscribe = useHabitStore.subscribe(
      (state) => {
        // Sincronizar quando houver mudanças
        debouncedSync(user.id);
      }
    );

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

  return {
    syncToSupabase: (userId: string) => debouncedSync(userId)
  };
}
