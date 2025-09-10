import { db } from './database';
import { useShopStore, defaultItems } from '@/stores/useShopStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useGoalStore } from '@/stores/useGoalStore';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useTaskStore } from '@/stores/useTaskStore';

class DataSyncService {
  private isSyncing = false;
  private hasSyncedHistoryOnce = false;
  private lastCleanupDate = '';
  
  // Function to get current date in Brazil timezone (UTC-3)
  private getBrazilToday(): string {
    const now = new Date();
    // Convert to Brazil timezone (UTC-3)
    const brazilOffset = -3 * 60; // -3 hours in minutes
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const brazilTime = new Date(utc + (brazilOffset * 60000));
    
    // Format as YYYY-MM-DD
    const year = brazilTime.getFullYear();
    const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
    const day = String(brazilTime.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  // Function to clean completed tasks after 23:59-00:00 in Brazil timezone
  private async cleanupCompletedTasks(userId: string): Promise<void> {
    const now = new Date();
    // Convert to Brazil timezone (UTC-3)
    const brazilOffset = -3 * 60; // -3 hours in minutes
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const brazilTime = new Date(utc + (brazilOffset * 60000));
    
    const brazilToday = this.getBrazilToday();
    const brazilHour = brazilTime.getHours();
    const brazilMinute = brazilTime.getMinutes();
    
    // Only run cleanup after 23:59 (11:59 PM) in Brazil timezone
    if (brazilHour < 23 || (brazilHour === 23 && brazilMinute < 59)) {
      console.log('🕐 [DEBUG] DataSyncService.cleanupCompletedTasks - Ainda não é 23:59 no fuso de Brasília, pulando limpeza');
      return;
    }
    
    // Only run cleanup once per day
    if (this.lastCleanupDate === brazilToday) {
      console.log('🕐 [DEBUG] DataSyncService.cleanupCompletedTasks - Limpeza já executada hoje, pulando');
      return;
    }

    try {
      console.log('🧹 [DEBUG] DataSyncService.cleanupCompletedTasks - Iniciando limpeza de tarefas concluídas após 23:59...');
      
      const tasks = useTaskStore.getState().tasks;
      const completedTasks = tasks.filter(task => task.completed);
      
      if (completedTasks.length === 0) {
        console.log('🧹 [DEBUG] DataSyncService.cleanupCompletedTasks - Nenhuma tarefa concluída para remover');
        this.lastCleanupDate = brazilToday;
        return;
      }
      
      // Remove completed tasks from local store
      const activeTasks = tasks.filter(task => !task.completed);
      useTaskStore.setState({ tasks: activeTasks });
      
      // Remove completed tasks from Supabase
      for (const task of completedTasks) {
        await db.deleteTask(userId, task.id);
      }
      
      this.lastCleanupDate = brazilToday;
      console.log('✅ [DEBUG] DataSyncService.cleanupCompletedTasks - Limpeza concluída:', completedTasks.length, 'tarefas removidas');
    } catch (error) {
      console.error('❌ [DEBUG] DataSyncService.cleanupCompletedTasks - Erro na limpeza:', error);
    }
  }
  
  // Load data from Supabase into stores and localStorage
  async loadAll(userId: string): Promise<void> {
    // 1. Gamification
    const gamification = await db.getGamificationData(userId);
    if (gamification) {
      // Apenas mesclar XP e coins para não perder progresso local
      const local = useGamificationStore.getState();
      const xp = Math.max(local.xp, gamification.xp);
      const coins = Math.max(local.coins, gamification.coins);
      // Atualizar XP e coins
      useGamificationStore.setState({ xp, coins });
      // 1.a. Carregar histórico de gamificação do Supabase
      const history = await db.getGamificationHistory(userId);
      useGamificationStore.setState({ history });
      // Recalcular atributos baseado no histórico carregado
      useGamificationStore.getState().init();
      // 1.b. Carregar histórico de ações (history_items)
      try {
        const historyItems = await db.getHistoryItems(userId);
        useGamificationStore.setState({ history: historyItems });
        console.log('✅ [DEBUG] DataSyncService.loadAll - history_items carregados:', historyItems.length);
      } catch (err) {
        console.error('❌ [DEBUG] DataSyncService.loadAll - erro ao carregar history_items:', err);
      }
    }
    // 2. User settings
    const settings = await db.getUserSettings(userId);
    if (settings) useShopStore.setState({ confettiEnabled: settings.confettiEnabled });

    // 3. Tasks
    const tasks = await db.getTasks(userId);
    if (tasks.length) {
      useTaskStore.setState({ tasks });
    }
    
    // 4. Habits: carregar hábitos e logs do Supabase
    const habits = await db.getHabits(userId);
    if (habits.length) {
      // Mapear hábitos por id
      const habitsMap = habits.reduce((acc, h) => {
        acc[h.id] = h;
        return acc;
      }, {} as Record<string, import('@/types/habit').Habit>);
      // Construir logs de conclusão
      const logs: Record<string, Record<string, number>> = {};
      for (const h of habits) {
        logs[h.id] = {};
        const dates = ((h as any).completedDates || []) as string[];
        for (const date of dates) {
          logs[h.id][date] = (logs[h.id][date] || 0) + 1;
        }
      }
      useHabitStore.setState({ habits: habitsMap, logs });
    }

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
    // Evitar execuções simultâneas
    if (this.isSyncing) {
      console.log('⚠️ [DEBUG] DataSyncService.syncAll - Já está sincronizando, pulando...');
      return;
    }
    
    this.isSyncing = true;
    console.log('🔍 [DEBUG] DataSyncService.syncAll iniciado para userId:', userId);
    console.log('🔍 [DEBUG] DataSyncService.syncAll - Stack trace:', new Error().stack);
    
    try {
      // 1. Gamification
      console.log('🔍 [DEBUG] DataSyncService.syncAll - Iniciando gamificação...');
      const gm = useGamificationStore.getState();
      await db.saveGamificationData({ userId, ...gm });
      console.log('✅ [DEBUG] DataSyncService.syncAll - Gamificação salva');
    // 1.a. Histórico de gamificação gerenciado diretamente em addHistoryItem; removido do syncAll para evitar duplicações
    
    // 2. Tasks: sincronizar a partir do store
    console.log('🔍 [DEBUG] DataSyncService.syncAll - Iniciando tarefas...');
    const tasksToSync = useTaskStore.getState().tasks;
    console.log('🔍 [DEBUG] DataSyncService.syncAll - Tarefas para sincronizar:', tasksToSync.length);
    for (const t of tasksToSync) await db.saveTask(userId, t);
    console.log('✅ [DEBUG] DataSyncService.syncAll - Tarefas sincronizadas');
    
    // 2.a. Limpeza de tarefas concluídas após meia-noite no fuso de Brasília
    await this.cleanupCompletedTasks(userId);

    // 3. Habits: sincronizar local para Supabase
    try {
      console.log('🔍 [DEBUG] DataSyncService.syncAll - Iniciando hábitos...');
      const state = useHabitStore.getState();
      const habitsToSync = Object.values(state.habits);
      console.log('🔍 [DEBUG] DataSyncService.syncAll - Hábitos para sincronizar:', habitsToSync.length);
      
      for (const habit of habitsToSync) {
        try {
          console.log('🔍 [DEBUG] DataSyncService.syncAll - Sincronizando hábito:', habit.id, habit.name);
          await db.saveHabit(userId, habit);
          console.log('✅ [DEBUG] DataSyncService.syncAll - Hábito salvo:', habit.name);
          
        } catch (habitError) {
          console.error('❌ [DEBUG] DataSyncService.syncAll - Erro ao sincronizar hábito:', habit.name, habitError);
          // Continuar com o próximo hábito
        }
      }
      console.log('✅ [DEBUG] DataSyncService.syncAll - Hábitos sincronizados');
    } catch (error) {
      console.error('❌ [DEBUG] DataSyncService.syncAll - Erro na seção de hábitos:', error);
      // Não fazer throw aqui para não interromper o sync
    }
    
    console.log('🔍 [DEBUG] DataSyncService.syncAll - Passou da seção de hábitos, continuando...');

    // 4. Goals: sincronizar a partir do store
    console.log('🔍 [DEBUG] DataSyncService.syncAll - Iniciando metas...');
    console.log('🔍 [DEBUG] DataSyncService.syncAll - CHEGOU NA SEÇÃO DE METAS!');
    const goalStore = useGoalStore.getState();
    console.log('🔍 [DEBUG] DataSyncService.syncAll - Estado completo do GoalStore:', goalStore);
    const goalsToSync = goalStore.goals;
    console.log('🔍 [DEBUG] DataSyncService.syncAll - Metas para sincronizar:', goalsToSync.length);
    for (const g of goalsToSync) {
      console.log('🔍 [DEBUG] DataSyncService.syncAll - Sincronizando meta:', g.id, g.title);
      await db.saveGoal(userId, g);
    }
    // METAS NUNCA SÃO REMOVIDAS AUTOMATICAMENTE
    // Apenas o usuário pode remover metas manualmente através do dropdown
    // Metas concluídas permanecem no sistema para histórico
    console.log('🔍 [DEBUG] DataSyncService.syncAll - Metas sincronizadas (sem limpeza automática)');
    console.log('✅ [DEBUG] DataSyncService.syncAll - Metas sincronizadas');

    // 5. Shop Items: sincronizar estado atual (comprado ou não) para Supabase
    const items = useShopStore.getState().items;
    for (const item of items) {
      await db.saveShopItem(userId, item as any);
    }
    
    console.log('✅ [DEBUG] DataSyncService.syncAll concluído com sucesso');
    } catch (error) {
      console.error('❌ [DEBUG] DataSyncService.syncAll erro:', error);
      // Não rethrow para não interromper outras seções de sincronização
    } finally {
      this.isSyncing = false;
      console.log('🔍 [DEBUG] DataSyncService.syncAll - Flag isSyncing resetada');
    }
  }
}

export const dataSyncService = new DataSyncService();
