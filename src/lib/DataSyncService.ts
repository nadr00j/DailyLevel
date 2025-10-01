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
  private IS_DEBUG = true; // ATIVADO para rastrear problema de performance
  
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
    
    if (this.IS_DEBUG) console.log('🕐 [DEBUG] DataSyncService.cleanupCompletedTasks - Verificando limpeza:', {
      brazilToday,
      lastCleanupDate: this.lastCleanupDate,
      shouldRun: this.lastCleanupDate !== brazilToday
    });
    
    // Only run cleanup once per day
    if (this.lastCleanupDate === brazilToday) {
      if (this.IS_DEBUG) console.log('🕐 [DEBUG] DataSyncService.cleanupCompletedTasks - Limpeza já executada hoje, pulando');
      return;
    }
    
    if (this.IS_DEBUG) console.log('🧹 [DEBUG] DataSyncService.cleanupCompletedTasks - Executando limpeza de tarefas concluídas do dia anterior...');

    try {
      const tasks = useTaskStore.getState().tasks;
      if (this.IS_DEBUG) console.log('🧹 [DEBUG] DataSyncService.cleanupCompletedTasks - Total de tarefas:', tasks.length);
      
      // Filtrar apenas tarefas concluídas que foram atualizadas no dia anterior
      const yesterday = this.getBrazilYesterday();
      const completedTasksFromYesterday = tasks.filter(task => {
        if (!task.completed) return false;
        
        // Verificar se a tarefa foi concluída no dia anterior
        const taskUpdatedDate = task.updatedAt ? task.updatedAt.split('T')[0] : null;
        return taskUpdatedDate === yesterday;
      });
      
      if (this.IS_DEBUG) console.log('🧹 [DEBUG] DataSyncService.cleanupCompletedTasks - Tarefas concluídas do dia anterior encontradas:', completedTasksFromYesterday.length);
      
      if (completedTasksFromYesterday.length === 0) {
        if (this.IS_DEBUG) console.log('🧹 [DEBUG] DataSyncService.cleanupCompletedTasks - Nenhuma tarefa concluída do dia anterior para remover');
        this.lastCleanupDate = brazilToday;
        return;
      }
      
      // Log das tarefas que serão removidas
      completedTasksFromYesterday.forEach(task => {
        if (this.IS_DEBUG) console.log('🧹 [DEBUG] DataSyncService.cleanupCompletedTasks - Removendo tarefa do dia anterior:', task.id, task.title, 'concluída em:', task.updatedAt);
      });
      
      // Remove completed tasks from previous day from local store
      const activeTasks = tasks.filter(task => {
        if (!task.completed) return true;
        const taskUpdatedDate = task.updatedAt ? task.updatedAt.split('T')[0] : null;
        return taskUpdatedDate !== yesterday;
      });
      
      useTaskStore.setState({ tasks: activeTasks });
      if (this.IS_DEBUG) console.log('🧹 [DEBUG] DataSyncService.cleanupCompletedTasks - Tarefas ativas restantes:', activeTasks.length);
      
      // Remove completed tasks from previous day from Supabase
      for (const task of completedTasksFromYesterday) {
        await db.deleteTask(userId, task.id);
        if (this.IS_DEBUG) console.log('🧹 [DEBUG] DataSyncService.cleanupCompletedTasks - Tarefa do dia anterior removida do Supabase:', task.id);
      }
      
      this.lastCleanupDate = brazilToday;
      if (this.IS_DEBUG) console.log('✅ [DEBUG] DataSyncService.cleanupCompletedTasks - Limpeza concluída:', completedTasksFromYesterday.length, 'tarefas do dia anterior removidas');
    } catch (error) {
      console.error('❌ [DEBUG] DataSyncService.cleanupCompletedTasks - Erro na limpeza:', error);
    }
  }

  // Public function to force cleanup of completed tasks (for testing)
  async forceCleanupCompletedTasks(userId: string): Promise<void> {
    if (this.IS_DEBUG) console.log('🧹 [DEBUG] DataSyncService.forceCleanupCompletedTasks - Forçando limpeza de tarefas concluídas...');
    this.lastCleanupDate = ''; // Reset to force cleanup
    await this.cleanupCompletedTasks(userId);
  }
  
  // Load data from Supabase into stores and localStorage
  async loadAll(userId: string): Promise<void> {
    if (!userId || userId === 'undefined') {
      console.error('❌ [DEBUG] DataSyncService.loadAll - userId inválido:', userId);
      return;
    }
    
    if (this.IS_DEBUG) console.log('🔄 [DEBUG] DataSyncService.loadAll - Iniciando carregamento para userId:', userId);
    
    // 1. Gamification
    if (this.IS_DEBUG) console.log('🔄 [DEBUG] DataSyncService.loadAll - Carregando dados de gamificação...');
    const gamification = await db.getGamificationData(userId);
    if (this.IS_DEBUG) console.log('🔄 [DEBUG] DataSyncService.loadAll - Dados de gamificação recebidos:', gamification);
    
    if (gamification) {
      if (this.IS_DEBUG) console.log('🔍 [DEBUG] DataSyncService.loadAll - Dados do Supabase:', {
        xp: gamification.xp,
        coins: gamification.coins,
        vitality: gamification.vitality,
        xp30d: gamification.xp30d
      });
      
      // SEMPRE sincronizar dados do Supabase como fonte da verdade
      if (this.IS_DEBUG) console.log('🔄 [DEBUG] DataSyncService.loadAll - Sincronizando dados do Supabase...');
      
      // Se dados do Supabase estão zerados, tentar reconciliação primeiro
      if ((gamification.xp === 0 && gamification.coins === 0)) {
        if (this.IS_DEBUG) console.log('⚠️ [DEBUG] DataSyncService.loadAll - Dados zerados, tentando reconciliação...');
        try {
          await this.reconcileFromHistory(userId);
          // Recarregar dados após reconciliação
          const updatedGamification = await db.getGamificationData(userId);
          if (updatedGamification) {
            useGamificationStoreV21.getState().syncFromSupabase({ ...updatedGamification, userId });
            if (this.IS_DEBUG) console.log('✅ [DEBUG] DataSyncService.loadAll - Dados reconciliados e sincronizados');
          }
        } catch (error) {
          console.error('❌ [DEBUG] DataSyncService.loadAll - Erro na reconciliação:', error);
          // Mesmo com erro, sincronizar o que temos
          useGamificationStoreV21.getState().syncFromSupabase({ ...gamification, userId });
        }
      } else {
        // Dados válidos, sincronizar normalmente
        useGamificationStoreV21.getState().syncFromSupabase({ ...gamification, userId });
        if (this.IS_DEBUG) console.log('✅ [DEBUG] DataSyncService.loadAll - Dados sincronizados');
      }
      
      // 1.a. Carregar histórico de ações (history_items)
      try {
        if (this.IS_DEBUG) console.log('🔄 [DEBUG] DataSyncService.loadAll - Carregando histórico de ações...');
        const historyItems = await db.getHistoryItems(userId);
        if (this.IS_DEBUG) console.log('🔄 [DEBUG] DataSyncService.loadAll - history_items recebidos do banco:', historyItems);
        
        // CRÍTICO: Converter dados do Supabase para formato do store
        const convertedHistory = historyItems.map(item => {
          // O campo 'ts' já vem como timestamp do getHistoryItems
          let timestamp = item.ts;
          
          // Validar se o timestamp é válido
          if (!timestamp || isNaN(timestamp)) {
            console.warn('[DataSync] Timestamp inválido encontrado:', { item, calculatedTs: timestamp });
            timestamp = Date.now(); // Usar timestamp atual como fallback
          }
          
          return {
            ts: timestamp,
            xp: item.xp || 0,
            coins: item.coins || 0, // CORREÇÃO: Incluir moedas na conversão
            type: item.type || 'task',
            tags: item.tags || [],
            category: item.category || undefined
          };
        });
        
        if (this.IS_DEBUG) console.log('🔄 [DEBUG] DataSyncService.loadAll - Dados convertidos:', convertedHistory.slice(0, 3));
        
        useGamificationStoreV21.setState({ history: convertedHistory });
        if (this.IS_DEBUG) console.log('✅ [DEBUG] DataSyncService.loadAll - history_items carregados no store:', convertedHistory.length);
        
        // Verificar se o store foi atualizado
        const storeHistory = useGamificationStoreV21.getState().history;
        if (this.IS_DEBUG) console.log('🔄 [DEBUG] DataSyncService.loadAll - Verificando store após carregamento:', {
          storeHistoryLength: storeHistory.length,
          storeHistory: storeHistory.slice(0, 3) // Primeiros 3 itens
        });
      } catch (err) {
        console.error('❌ [DEBUG] DataSyncService.loadAll - erro ao carregar history_items:', err);
      }
    } else {
      if (this.IS_DEBUG) console.log('⚠️ [DEBUG] DataSyncService.loadAll - Nenhum dado de gamificação encontrado no Supabase');
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
        if (this.IS_DEBUG) console.log('✅ [DEBUG] DataSyncService.loadAll - PixelBuddy carregado');
      }
    } catch (error: any) {
      if (error?.code === 'PGRST205' || error?.message?.includes('Could not find the table')) {
        if (this.IS_DEBUG) console.warn('⚠️ [DEBUG] DataSyncService.loadAll - Tabela pixelbuddy_state não existe. Execute o SQL de criação da tabela.');
        if (this.IS_DEBUG) console.warn('📋 [DEBUG] DataSyncService.loadAll - Consulte o arquivo: create-pixelbuddy-state-table.sql');
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
    if (this.IS_DEBUG) console.log('🔄 [DEBUG] DataSyncService.loadAll - Carregando metas...');
    const goals = await db.getGoals(userId);
    if (this.IS_DEBUG) console.log('🔄 [DEBUG] DataSyncService.loadAll - Metas recebidas do banco:', {
      goalsLength: goals.length,
      goals: goals.map(g => ({ id: g.id, title: g.title, category: g.category, isCompleted: g.isCompleted }))
    });
    if (goals.length) {
      useGoalStore.setState({ goals });
      if (this.IS_DEBUG) console.log('✅ [DEBUG] DataSyncService.loadAll - Metas carregadas no store');
      
      // Verificar se o store foi atualizado
      const storeGoals = useGoalStore.getState().goals;
      if (this.IS_DEBUG) console.log('🔄 [DEBUG] DataSyncService.loadAll - Verificando store de metas:', {
        storeGoalsLength: storeGoals.length,
        storeGoals: storeGoals.map(g => ({ id: g.id, title: g.title, category: g.category }))
      });
    } else {
      if (this.IS_DEBUG) console.log('⚠️ [DEBUG] DataSyncService.loadAll - Nenhuma meta encontrada no Supabase');
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

  // Reconciliar dados baseado no histórico
  async reconcileFromHistory(userId: string): Promise<void> {
    if (!userId || userId === 'undefined') {
      console.error('❌ [DataSync] reconcileFromHistory - userId inválido:', userId);
      return;
    }
    
    try {
      if (this.IS_DEBUG) console.log('🔧 [DataSync] Iniciando reconciliação baseada no histórico...');
      
      // Buscar histórico completo
      const historyItems = await db.getHistoryItems(userId);
      if (!historyItems || historyItems.length === 0) {
        if (this.IS_DEBUG) console.log('⚠️ [DataSync] Nenhum histórico encontrado para reconciliação');
        return;
      }
      
      // Calcular totais corretos
      const totalXP = historyItems.reduce((sum, item) => sum + (item.xp || 0), 0);
      const totalCoins = historyItems.reduce((sum, item) => sum + (item.coins || 0), 0);
      
      // Calcular XP dos últimos 30 dias
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const recentHistory = historyItems.filter(item => {
        return item.ts >= thirtyDaysAgo;
      });
      const xp30d = recentHistory.reduce((sum, item) => sum + (item.xp || 0), 0);
      
      if (this.IS_DEBUG) console.log('📊 [DataSync] Dados reconciliados:', { totalXP, totalCoins, xp30d });
      
      // Atualizar user_gamification no Supabase
      const correctedData = {
        xp: totalXP,
        coins: totalCoins,
        xp30d: xp30d,
        updated_at: new Date().toISOString()
      };
      
      await db.saveGamificationData({ userId, ...useGamificationStoreV21.getState(), ...correctedData });
      
      // Atualizar store local
      const completeData = {
        ...correctedData,
        userId,
        history: historyItems.map(item => {
          // O timestamp já vem correto do getHistoryItems
          let timestamp = item.ts;
          
          if (!timestamp || isNaN(timestamp)) {
            console.warn('[Reconcile] Timestamp inválido encontrado:', { item, calculatedTs: timestamp });
            timestamp = Date.now();
          }
          
          return {
            ts: timestamp,
            xp: item.xp || 0,
            coins: item.coins || 0, // CORREÇÃO: Incluir moedas também aqui
            type: item.type,
            tags: item.tags || [],
            category: item.category
          };
        }),
        config: useGamificationStoreV21.getState().config
      };
      
      useGamificationStoreV21.getState().syncFromSupabase(completeData);
      if (this.IS_DEBUG) console.log('✅ [DataSync] Reconciliação concluída com sucesso');
      
    } catch (error) {
      console.error('❌ [DataSync] Erro na reconciliação:', error);
    }
  }

  // Verificar e corrigir vitalidade
  async validateVitality(userId: string): Promise<void> {
    try {
      const gm = useGamificationStoreV21.getState();
      const xp30d = gm.xp30d || 0;
      const target = gm.config?.points?.vitalityMonthlyTarget || 500;
      const expectedVitality = Math.min(100, Math.round((xp30d / target) * 100));
      
      if (Math.abs(gm.vitality - expectedVitality) > 5) { // Tolerância de 5 pontos
        console.log(`🔧 [DataSync] Corrigindo vitalidade: ${gm.vitality} → ${expectedVitality}`);
        gm.syncVitalityFromSupabase(expectedVitality);
      }
    } catch (error) {
      console.warn('⚠️ [DataSync] Erro ao validar vitalidade:', error);
    }
  }

  // Sync local changes to Supabase
  async syncAll(userId: string): Promise<void> {
    if (!userId || userId === 'undefined') {
      console.error('❌ [DEBUG] DataSyncService.syncAll - userId inválido:', userId);
      return;
    }
    
    // Evitar execuções simultâneas
    if (this.isSyncing) {
      if (this.IS_DEBUG) console.log('⚠️ [DEBUG] DataSyncService.syncAll - Já está sincronizando, pulando...');
      return;
    }
    
    this.isSyncing = true;
    if (this.IS_DEBUG) console.log('🔍 [DEBUG] DataSyncService.syncAll iniciado para userId:', userId);
    if (this.IS_DEBUG) console.log('🔍 [DEBUG] DataSyncService.syncAll - Stack trace:', new Error().stack);
    
    try {
      // 1. Gamification
      if (this.IS_DEBUG) console.log('🔍 [DEBUG] DataSyncService.syncAll - Iniciando gamificação...');
      const gm = useGamificationStoreV21.getState();
      await db.saveGamificationData({ userId, ...gm });
      if (this.IS_DEBUG) console.log('✅ [DEBUG] DataSyncService.syncAll - Gamificação salva');
    // 1.a. Histórico de gamificação gerenciado diretamente em addHistoryItem; removido do syncAll para evitar duplicações
    
    // 2. Tasks: sincronizar a partir do store
    if (this.IS_DEBUG) console.log('🔍 [DEBUG] DataSyncService.syncAll - Iniciando tarefas...');
    const tasksToSync = useTaskStore.getState().tasks;
    if (this.IS_DEBUG) console.log('🔍 [DEBUG] DataSyncService.syncAll - Tarefas para sincronizar:', tasksToSync.length);
    for (const t of tasksToSync) await db.saveTask(userId, t);
    if (this.IS_DEBUG) console.log('✅ [DEBUG] DataSyncService.syncAll - Tarefas sincronizadas');
    
    // 2.a. Limpeza de tarefas concluídas após meia-noite no fuso de Brasília
    await this.cleanupCompletedTasks(userId);

    // 3. Habits: sincronizar local para Supabase
    try {
      if (this.IS_DEBUG) console.log('🔍 [DEBUG] DataSyncService.syncAll - Iniciando hábitos...');
      const state = useHabitStore.getState();
      const habitsToSync = Object.values(state.habits);
      if (this.IS_DEBUG) console.log('🔍 [DEBUG] DataSyncService.syncAll - Hábitos para sincronizar:', habitsToSync.length);
      
      for (const habit of habitsToSync) {
        try {
          if (this.IS_DEBUG) console.log('🔍 [DEBUG] DataSyncService.syncAll - Sincronizando hábito:', habit.id, habit.name);
          await db.saveHabit(userId, habit);
          if (this.IS_DEBUG) console.log('✅ [DEBUG] DataSyncService.syncAll - Hábito salvo:', habit.name);
          
        } catch (habitError) {
          console.error('❌ [DEBUG] DataSyncService.syncAll - Erro ao sincronizar hábito:', habit.name, habitError);
          // Continuar com o próximo hábito
        }
      }
      if (this.IS_DEBUG) console.log('✅ [DEBUG] DataSyncService.syncAll - Hábitos sincronizados');
    } catch (error) {
      console.error('❌ [DEBUG] DataSyncService.syncAll - Erro na seção de hábitos:', error);
      // Não fazer throw aqui para não interromper o sync
    }
    
    if (this.IS_DEBUG) console.log('🔍 [DEBUG] DataSyncService.syncAll - Passou da seção de hábitos, continuando...');

    // 4. Goals: sincronizar a partir do store
    if (this.IS_DEBUG) console.log('🔍 [DEBUG] DataSyncService.syncAll - Iniciando metas...');
    if (this.IS_DEBUG) console.log('🔍 [DEBUG] DataSyncService.syncAll - CHEGOU NA SEÇÃO DE METAS!');
    const goalStore = useGoalStore.getState();
    if (this.IS_DEBUG) console.log('🔍 [DEBUG] DataSyncService.syncAll - Estado completo do GoalStore:', goalStore);
    const goalsToSync = goalStore.goals;
    if (this.IS_DEBUG) console.log('🔍 [DEBUG] DataSyncService.syncAll - Metas para sincronizar:', goalsToSync.length);
    for (const g of goalsToSync) {
      if (this.IS_DEBUG) console.log('🔍 [DEBUG] DataSyncService.syncAll - Sincronizando meta:', g.id, g.title);
      await db.saveGoal(userId, g);
    }
    // METAS NUNCA SÃO REMOVIDAS AUTOMATICAMENTE
    // Apenas o usuário pode remover metas manualmente através do dropdown
    // Metas concluídas permanecem no sistema para histórico
    if (this.IS_DEBUG) console.log('🔍 [DEBUG] DataSyncService.syncAll - Metas sincronizadas (sem limpeza automática)');
    if (this.IS_DEBUG) console.log('✅ [DEBUG] DataSyncService.syncAll - Metas sincronizadas');

    // 5. PixelBuddy: sincronizar estado atual (equipamentos e inventário)
    if (this.IS_DEBUG) console.log('🔍 [DEBUG] DataSyncService.syncAll - Iniciando sincronização do PixelBuddy...');
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
      if (this.IS_DEBUG) console.log('✅ [DEBUG] DataSyncService.syncAll - PixelBuddy sincronizado');
    } catch (error: any) {
      if (error?.code === 'PGRST205' || error?.message?.includes('Could not find the table')) {
        if (this.IS_DEBUG) console.warn('⚠️ [DEBUG] DataSyncService.syncAll - Tabela pixelbuddy_state não existe. Execute o SQL de criação da tabela.');
        if (this.IS_DEBUG) console.warn('📋 [DEBUG] DataSyncService.syncAll - Consulte o arquivo: create-pixelbuddy-state-table.sql');
      } else {
        console.error('❌ [DEBUG] DataSyncService.syncAll - Erro na sincronização do PixelBuddy:', error);
      }
    }

    // 6. Shop Items: sincronizar estado atual (comprado ou não) para Supabase
    const items = useShopStore.getState().items;
    for (const item of items) {
      await db.saveShopItem(userId, item as any);
    }
    
    if (this.IS_DEBUG) console.log('✅ [DEBUG] DataSyncService.syncAll concluído com sucesso');
    } catch (error) {
      console.error('❌ [DEBUG] DataSyncService.syncAll erro:', error);
      // Não rethrow para não interromper outras seções de sincronização
    } finally {
      this.isSyncing = false;
      if (this.IS_DEBUG) console.log('🔍 [DEBUG] DataSyncService.syncAll - Flag isSyncing resetada');
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
    if (this.IS_DEBUG) console.log('🧪 Testando limpeza manual de tarefas...');
    await dataSyncService.forceCleanupCompletedTasks(userId);
  };
}
