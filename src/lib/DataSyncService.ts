import { db } from './database';
import { storage } from './storage';
import { useShopStore, defaultItems } from '@/stores/useShopStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useGoalStore } from '@/stores/useGoalStore';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useTaskStore } from '@/stores/useTaskStore';

class DataSyncService {
  // Load data from Supabase into stores and localStorage
  async loadAll(userId: string): Promise<void> {
    // 1. Gamification
    const gamification = await db.getGamificationData(userId);
    if (gamification) {
      // Apenas mesclar XP e coins para não perder progresso local
      const local = useGamificationStore.getState();
      const xp = Math.max(local.xp, gamification.xp);
      const coins = Math.max(local.coins, gamification.coins);
      useGamificationStore.setState({ xp, coins });
      // Recalcular atributos baseado no history local
      useGamificationStore.getState().init();
    }
    // 2. User settings
    const settings = await db.getUserSettings(userId);
    if (settings) useShopStore.setState({ confettiEnabled: settings.confettiEnabled });

    // 3. Tasks
    const tasks = await db.getTasks(userId);
    if (tasks.length) {
      useTaskStore.setState({ tasks });
    }

    // 4. Habits: estado hidratado pelo Zustand persist (storage local), não sobrescrever here
    
    // 5. Goals
    const goals = await db.getGoals(userId);
    if (goals.length) useGoalStore.setState({ goals });

    // 6. Shop Items
    const shopItems = await db.getShopItems(userId);
    useShopStore.setState({ items: [...defaultItems] }); // reset
    for (const item of shopItems) {
      const current = useShopStore.getState().items.find(i => i.id === item.id);
      if (current) {
        useShopStore.setState({ items: useShopStore.getState().items.map(i => i.id === item.id ? { ...i, purchased: item.purchased } : i) });
      }
    }
  }

  // Sync local changes to Supabase
  async syncAll(userId: string): Promise<void> {
    // 1. Gamification
    const gm = useGamificationStore.getState();
    await db.saveGamificationData({ userId, ...gm });
    
    // 2. Task
    const tasks = await storage.getTasks();
    for (const t of tasks) await db.saveTask(userId, t);

    // 3. Habits: sincronizar local para Supabase
    const state = useHabitStore.getState();
    const habitsToSync = Object.values(state.habits);
    for (const habit of habitsToSync) {
      await db.saveHabit(userId, habit);
      // sincroniza logs de conclusões
      const habitLogs = state.logs[habit.id] || {};
      for (const date of Object.keys(habitLogs)) {
        for (let i = 0; i < habitLogs[date]; i++) {
          await db.completeHabit(habit.id, date);
        }
      }
    }

    // 4. Goals
    const goals = await storage.getGoals();
    for (const g of goals) await db.saveGoal(userId, g);

    // 5. Shop Items: sincronizar estado atual (comprado ou não) para Supabase
    const items = useShopStore.getState().items;
    for (const item of items) {
      await db.saveShopItem(userId, item as any);
    }
  }
}

export const dataSyncService = new DataSyncService();
