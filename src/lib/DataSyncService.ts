import { db } from './database';
import { useShopStore, defaultItems } from '@/stores/useShopStore';
import { useHabitStore } from '@/stores/useHabitStore';
import { useGoalStore } from '@/stores/useGoalStore';
import { useGamificationStoreV21 } from '@/stores/useGamificationStoreV21';
import { useTaskStore } from '@/stores/useTaskStore';
import { usePixelBuddyStore } from '@/stores/usePixelBuddyStore';
import { useAuthStore } from '@/stores/useAuthStore';

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

  // Get yesterday's date in Brazil timezone (UTC-3)
  private getBrazilYesterday(): string {
    const now = new Date();
    const brazilOffset = -3 * 60; // -3 hours in minutes
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const brazilTime = new Date(utc + (brazilOffset * 60000));
    
    // Subtract one day
    brazilTime.setDate(brazilTime.getDate() - 1);
    
    // Format as YYYY-MM-DD
    const year = brazilTime.getFullYear();
    const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
    const day = String(brazilTime.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  // Function to clean completed tasks from previous day after midnight in Brazil timezone
  private async cleanupCompletedTasks(userId: string): Promise<void> {
    const brazilToday = this.getBrazilToday();
    
    console.log('🕐 [DEBUG] DataSyncService.cleanupCompletedTasks - Verificando limpeza:', {
      brazilToday,
      lastCleanupDate: this.lastCleanupDate,
      shouldRun: this.lastCleanupDate !== brazilToday
    });
    
    // Only run cleanup once per day
    if (this.lastCleanupDate === brazilToday) {
      console.log('🕐 [DEBUG] DataSyncService.cleanupCompletedTasks - Limpeza já executada hoje, pulando');
      return;
    }
    
    console.log('🧹 [DEBUG] DataSyncService.cleanupCompletedTasks - Executando limpeza de tarefas concluídas do dia anterior...');

    try {
      const tasks = useTaskStore.getState().tasks;
      console.log('🧹 [DEBUG] DataSyncService.cleanupCompletedTasks - Total de tarefas:', tasks.length);
      
      // Filtrar apenas tarefas concluídas que foram atualizadas no dia anterior
      const yesterday = this.getBrazilYesterday();
      const completedTasksFromYesterday = tasks.filter(task => {
        if (!task.completed) return false;
        
        // Verificar se a tarefa foi concluída no dia anterior
        const taskUpdatedDate = task.updatedAt ? task.updatedAt.split('T')[0] : null;
        return taskUpdatedDate === yesterday;
      });
      
      console.log('🧹 [DEBUG] DataSyncService.cleanupCompletedTasks - Tarefas concluídas do dia anterior encontradas:', completedTasksFromYesterday.length);
      
      if (completedTasksFromYesterday.length === 0) {
        console.log('🧹 [DEBUG] DataSyncService.cleanupCompletedTasks - Nenhuma tarefa concluída do dia anterior para remover');
        this.lastCleanupDate = brazilToday;
        return;
      }
      
      // Log das tarefas que serão removidas
      completedTasksFromYesterday.forEach(task => {
        console.log('🧹 [DEBUG] DataSyncService.cleanupCompletedTasks - Removendo tarefa do dia anterior:', task.id, task.title, 'concluída em:', task.updatedAt);
      });
      
      // Remove completed tasks from previous day from local store
      const activeTasks = tasks.filter(task => {
        if (!task.completed) return true;
        const taskUpdatedDate = task.updatedAt ? task.updatedAt.split('T')[0] : null;
        return taskUpdatedDate !== yesterday;
      });
      
      useTaskStore.setState({ tasks: activeTasks });
      console.log('🧹 [DEBUG] DataSyncService.cleanupCompletedTasks - Tarefas ativas restantes:', activeTasks.length);
      
      // Remove completed tasks from previous day from Supabase
      for (const task of completedTasksFromYesterday) {
        await db.deleteTask(userId, task.id);
        console.log('🧹 [DEBUG] DataSyncService.cleanupCompletedTasks - Tarefa do dia anterior removida do Supabase:', task.id);
      }
      
      this.lastCleanupDate = brazilToday;
      console.log('✅ [DEBUG] DataSyncService.cleanupCompletedTasks - Limpeza concluída:', completedTasksFromYesterday.length, 'tarefas do dia anterior removidas');
    } catch (error) {
      console.error('❌ [DEBUG] DataSyncService.cleanupCompletedTasks - Erro na limpeza:', error);
    }
  }

  // Public function to force cleanup of completed tasks (for testing)
  async forceCleanupCompletedTasks(userId: string): Promise<void> {
    console.log('🧹 [DEBUG] DataSyncService.forceCleanupCompletedTasks - Forçando limpeza de tarefas concluídas...');
    this.lastCleanupDate = ''; // Reset to force cleanup
    await this.cleanupCompletedTasks(userId);
  }
  
  // Load data from Supabase into stores and localStorage
  async loadAll(userId: string): Promise<void> {
    console.log('🔄 [DEBUG] DataSyncService.loadAll - Iniciando carregamento para userId:', userId);
    
    // 1. Gamification
    console.log('🔄 [DEBUG] DataSyncService.loadAll - Carregando dados de gamificação...');
    const gamification = await db.getGamificationData(userId);
    console.log('🔄 [DEBUG] DataSyncService.loadAll - Dados de gamificação recebidos:', gamification);
    
    if (gamification) {
      // Carregar dados do Supabase no store V2.1
      console.log('🔄 [DEBUG] DataSyncService.loadAll - Sincronizando dados no store V2.1...');
      useGamificationStoreV21.getState().syncFromSupabase(gamification);
      console.log('✅ [DEBUG] DataSyncService.loadAll - Dados sincronizados no store V2.1');
      
      // 1.a. Carregar histórico de ações (history_items)
      try {
        console.log('🔄 [DEBUG] DataSyncService.loadAll - Carregando histórico de ações...');
        const historyItems = await db.getHistoryItems(userId);
        console.log('🔄 [DEBUG] DataSyncService.loadAll - history_items recebidos do banco:', historyItems);
        useGamificationStoreV21.setState({ history: historyItems });
        console.log('✅ [DEBUG] DataSyncService.loadAll - history_items carregados no store:', historyItems.length);
        
        // Verificar se o store foi atualizado
        const storeHistory = useGamificationStoreV21.getState().history;
        console.log('🔄 [DEBUG] DataSyncService.loadAll - Verificando store após carregamento:', {
          storeHistoryLength: storeHistory.length,
          storeHistory: storeHistory.slice(0, 3) // Primeiros 3 itens
        });
      } catch (err) {
        console.error('❌ [DEBUG] DataSyncService.loadAll - erro ao carregar history_items:', err);
      }
    } else {
      console.log('⚠️ [DEBUG] DataSyncService.loadAll - Nenhum dado de gamificação encontrado no Supabase');
    }
    // 2. User settings
    const settings = await db.getUserSettings(userId);
    if (settings) useShopStore.setState({ confettiEnabled: settings.confettiEnabled });

    // 3. PixelBuddy: carregar estado do PixelBuddy
    try {
      const pixelBuddyState = await db.getPixelBuddyState(userId);
      if (pixelBuddyState) {
        usePixelBuddyStore.setState({
          body: pixelBuddyState.body,
          head: pixelBuddyState.head,
          clothes: pixelBuddyState.clothes,
          accessory: pixelBuddyState.accessory,
          hat: pixelBuddyState.hat,
          effect: pixelBuddyState.effect,
          inventory: pixelBuddyState.inventory
        });
        console.log('✅ [DEBUG] DataSyncService.loadAll - PixelBuddy carregado');
      }
    } catch (error: any) {
      if (error?.code === 'PGRST205' || error?.message?.includes('Could not find the table')) {
        console.warn('⚠️ [DEBUG] DataSyncService.loadAll - Tabela pixelbuddy_state não existe. Execute o SQL de criação da tabela.');
        console.warn('📋 [DEBUG] DataSyncService.loadAll - Consulte o arquivo: create-pixelbuddy-state-table.sql');
      } else {
        console.error('❌ [DEBUG] DataSyncService.loadAll - Erro ao carregar PixelBuddy:', error);
      }
    }

    // 4. Tasks
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
    console.log('🔄 [DEBUG] DataSyncService.loadAll - Carregando metas...');
    const goals = await db.getGoals(userId);
    console.log('🔄 [DEBUG] DataSyncService.loadAll - Metas recebidas do banco:', {
      goalsLength: goals.length,
      goals: goals.map(g => ({ id: g.id, title: g.title, category: g.category, isCompleted: g.isCompleted }))
    });
    if (goals.length) {
      useGoalStore.setState({ goals });
      console.log('✅ [DEBUG] DataSyncService.loadAll - Metas carregadas no store');
      
      // Verificar se o store foi atualizado
      const storeGoals = useGoalStore.getState().goals;
      console.log('🔄 [DEBUG] DataSyncService.loadAll - Verificando store de metas:', {
        storeGoalsLength: storeGoals.length,
        storeGoals: storeGoals.map(g => ({ id: g.id, title: g.title, category: g.category }))
      });
    } else {
      console.log('⚠️ [DEBUG] DataSyncService.loadAll - Nenhuma meta encontrada no Supabase');
    }

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
      const gm = useGamificationStoreV21.getState();
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

    // 5. PixelBuddy: sincronizar estado atual (equipamentos e inventário)
    console.log('🔍 [DEBUG] DataSyncService.syncAll - Iniciando sincronização do PixelBuddy...');
    try {
      const pixelBuddyState = usePixelBuddyStore.getState();
      await db.savePixelBuddyState(userId, {
        body: pixelBuddyState.body,
        head: pixelBuddyState.head,
        clothes: pixelBuddyState.clothes,
        accessory: pixelBuddyState.accessory,
        hat: pixelBuddyState.hat,
        effect: pixelBuddyState.effect,
        inventory: pixelBuddyState.inventory
      });
      console.log('✅ [DEBUG] DataSyncService.syncAll - PixelBuddy sincronizado');
    } catch (error: any) {
      if (error?.code === 'PGRST205' || error?.message?.includes('Could not find the table')) {
        console.warn('⚠️ [DEBUG] DataSyncService.syncAll - Tabela pixelbuddy_state não existe. Execute o SQL de criação da tabela.');
        console.warn('📋 [DEBUG] DataSyncService.syncAll - Consulte o arquivo: create-pixelbuddy-state-table.sql');
      } else {
        console.error('❌ [DEBUG] DataSyncService.syncAll - Erro na sincronização do PixelBuddy:', error);
      }
    }

    // 6. Shop Items: sincronizar estado atual (comprado ou não) para Supabase
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

// Função global para testar limpeza manual (disponível no console do navegador)
if (typeof window !== 'undefined') {
  (window as any).testCleanupTasks = async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      console.error('❌ Usuário não logado');
      return;
    }
    console.log('🧪 Testando limpeza manual de tarefas...');
    await dataSyncService.forceCleanupCompletedTasks(userId);
  };
}
