import { useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { db } from '@/lib/database';
import { storage } from '@/lib/storage';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useShopStore } from '@/stores/useShopStore';
import { useHabitStore } from '@/stores/useHabitStore';
import localforage from 'localforage';

export function useSupabaseSync() {
  const { user, isAuthenticated } = useAuthStore();

  // Sincronizar dados do Supabase para localStorage quando usuário fizer login
  const loadFromSupabase = useCallback(async (userId: string) => {
    try {
      console.log('🔄 Carregando dados do Supabase...');
      
      // 1. Carregar dados de gamificação
      const gamificationData = await db.getGamificationData(userId);
      if (gamificationData) {
        console.log('✅ Dados de gamificação carregados');
        useGamificationStore.setState({
          xp: gamificationData.xp,
          coins: gamificationData.coins,
          xp30d: gamificationData.xp30d,
          vitality: gamificationData.vitality,
          mood: gamificationData.mood,
          xpMultiplier: gamificationData.xpMultiplier,
          xpMultiplierExpiry: gamificationData.xpMultiplierExpiry,
          str: gamificationData.str,
          int: gamificationData.int,
          cre: gamificationData.cre,
          soc: gamificationData.soc,
          aspect: gamificationData.aspect,
          rankIdx: gamificationData.rankIdx,
          rankTier: gamificationData.rankTier,
          rankDiv: gamificationData.rankDiv
        });
      }

      // 2. Carregar configurações do usuário
      const userSettings = await db.getUserSettings(userId);
      if (userSettings) {
        console.log('✅ Configurações carregadas');
        useShopStore.setState({
          confettiEnabled: userSettings.confettiEnabled
        });
      }

      // 3. Carregar tarefas
      const tasks = await db.getTasks(userId);
      if (tasks && tasks.length > 0) {
        console.log(`✅ ${tasks.length} tarefas carregadas`);
        await storage.saveTasks(tasks);
      }

      // 4. Carregar hábitos (duas formas)
      const habits = await db.getHabits(userId);
      if (habits && habits.length > 0) {
        console.log(`✅ ${habits.length} hábitos carregados`);
        
        // Salvar no storage simples
        await storage.saveHabits(habits);
        
        // Converter para o formato do store Zustand
        const habitsObject = habits.reduce((acc: any, habit: any) => {
          acc[habit.id] = {
            ...habit,
            name: habit.title, // Mapear title -> name
            iconType: 'emoji', // Default
            iconValue: '📝', // Default
            categories: [], // Default
            targetInterval: habit.frequency === 'daily' ? 'daily' : 'weekly',
            targetCount: 1, // Default
            order: 0 // Default
          };
          return acc;
        }, {});
        
        // Salvar no store Zustand
        await localforage.setItem('dl.habits.v1', {
          state: { 
            habits: habitsObject, 
            logs: {}, 
            habitCategoryOrder: [] 
          },
          version: 0
        });
        
        // Atualizar o store Zustand
        useHabitStore.setState({
          habits: habitsObject
        });
      }

      // 5. Carregar metas
      const goals = await db.getGoals(userId);
      if (goals && goals.length > 0) {
        console.log(`✅ ${goals.length} metas carregadas`);
        await storage.saveGoals(goals);
      }

      // 6. Carregar itens da loja
      const shopItems = await db.getShopItems(userId);
      if (shopItems && shopItems.length > 0) {
        console.log(`✅ ${shopItems.length} itens da loja carregados`);
        useShopStore.setState({
          items: shopItems
        });
      }

      console.log('🎉 Todos os dados carregados do Supabase!');
      
    } catch (error) {
      console.error('❌ Erro ao carregar dados do Supabase:', error);
    }
  }, []);

  // Sincronizar dados locais para o Supabase
  const syncToSupabase = useCallback(async (userId: string) => {
    try {
      console.log('🔄 Sincronizando dados para o Supabase...');
      
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

      // 4. Sincronizar hábitos (duas formas)
      const habits = await storage.getHabits();
      for (const habit of habits) {
        await db.saveHabit(userId, habit);
      }

      // Sincronizar hábitos do store Zustand também
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

      // 5. Sincronizar metas
      const goals = await storage.getGoals();
      for (const goal of goals) {
        await db.saveGoal(userId, goal);
      }

      console.log('🎉 Dados sincronizados para o Supabase!');
      
    } catch (error) {
      console.error('❌ Erro ao sincronizar dados para o Supabase:', error);
    }
  }, []);

  // Carregar dados quando usuário fizer login
  useEffect(() => {
    if (isAuthenticated && user) {
      loadFromSupabase(user.id);
    }
  }, [isAuthenticated, user, loadFromSupabase]);

  return {
    loadFromSupabase,
    syncToSupabase
  };
}
