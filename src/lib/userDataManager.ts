import type { UserData } from '@/types/sync';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useShopStore } from '@/stores/useShopStore';
import { storage } from '@/lib/storage';
import localforage from 'localforage';

export interface UserDataFile {
  userId: string;
  metadata: {
    createdAt: number;
    lastUpdated: number;
    version: string;
    totalXp: number;
    totalCoins: number;
    tasksCount: number;
    habitsCount: number;
    goalsCount: number;
  };
  data: {
    gamification: any;
    tasks: any[];
    habits: any[];
    goals: any[];
    shop: any;
  };
}

export class UserDataManager {
  private static readonly DATA_DIR = '/user-data';
  private static readonly VERSION = '1.0.0';
  private static readonly USERNAME = 'Nadr00J';

  // Salvar dados automaticamente em JSON dentro do projeto
  static async saveUserDataAuto(): Promise<void> {
    try {
      const gamificationData = useGamificationStore.getState();
      const shopData = useShopStore.getState();
      
      // Coletar dados reais diretamente do storage
      const tasks = await storage.getTasks();
      const goals = await storage.getGoals();
      
      // Coletar hábitos do store Zustand de hábitos
      const habitsStoreRaw = await localforage.getItem<any>('dl.habits.v1');
      let habits: any[] = [];
      
      try {
        let habitsStore: any = null;
        
        // Se for string, fazer parse, senão usar diretamente
        if (typeof habitsStoreRaw === 'string') {
          habitsStore = JSON.parse(habitsStoreRaw);
        } else {
          habitsStore = habitsStoreRaw;
        }
        
        if (habitsStore && habitsStore.state && habitsStore.state.habits) {
          habits = Object.values(habitsStore.state.habits);
          
          // Adicionar logs de cada hábito se disponível
          if (habitsStore.state.logs) {
            habits = habits.map(habit => ({
              ...habit,
              logs: habitsStore.state.logs[habit.id] || {}
            }));
          }
        }
      } catch (error) {
        console.error('[UserData] Error parsing habitsStore:', error);
        habits = [];
      }
      
      // Contar itens para metadata
      const tasksCount = tasks.length;
      const habitsCount = habits.length;
      const goalsCount = goals.length;
      
      const userData: UserDataFile = {
        userId: this.USERNAME,
        metadata: {
          createdAt: Date.now(),
          lastUpdated: Date.now(),
          version: this.VERSION,
          totalXp: gamificationData.xp,
          totalCoins: gamificationData.coins,
          tasksCount,
          habitsCount,
          goalsCount,
        },
        data: {
          gamification: {
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
            rankDiv: gamificationData.rankDiv,
            history: gamificationData.history,
            config: gamificationData.config
          },
          tasks: tasks,
          habits: habits,
          goals: goals,
          shop: {
            items: shopData.items,
            confettiEnabled: shopData.confettiEnabled
          }
        }
      };

      console.log('[UserData] Dados coletados para usuário:', this.USERNAME);
      
      // Retornar os dados em vez de fazer download automático
      return userData;
    } catch (error) {
      console.error('[UserData] Erro ao salvar dados:', error);
      throw error;
    }
  }

  // Salvar dados do usuário em arquivo JSON (mantido para compatibilidade)
  static async saveUserData(userId: string): Promise<void> {
    return this.saveUserDataAuto();
  }

  // Carregar dados do usuário de arquivo JSON
  static async loadUserData(file: File): Promise<UserDataFile> {
    try {
      const text = await file.text();
      const userData: UserDataFile = JSON.parse(text);
      
      // Validar estrutura do arquivo
      if (!userData.userId || !userData.metadata || !userData.data) {
        throw new Error('Arquivo de dados inválido');
      }

      console.log('[UserData] Dados carregados para usuário:', userData.userId);
      return userData;
    } catch (error) {
      console.error('[UserData] Erro ao carregar dados:', error);
      throw error;
    }
  }

  // Aplicar dados carregados aos stores
  static async applyUserData(userData: UserDataFile): Promise<void> {
    try {
      // Aplicar dados de gamificação
      const { gamification } = userData.data;
      useGamificationStore.setState({
        xp: gamification.xp,
        coins: gamification.coins,
        xp30d: gamification.xp30d,
        vitality: gamification.vitality,
        mood: gamification.mood,
        xpMultiplier: gamification.xpMultiplier,
        xpMultiplierExpiry: gamification.xpMultiplierExpiry,
        str: gamification.str,
        int: gamification.int,
        cre: gamification.cre,
        soc: gamification.soc,
        aspect: gamification.aspect,
        rankIdx: gamification.rankIdx,
        rankTier: gamification.rankTier,
        rankDiv: gamification.rankDiv,
        history: gamification.history,
        config: gamification.config
      });

      // Aplicar dados da loja
      const { shop } = userData.data;
      useShopStore.setState({
        items: shop.items,
        confettiEnabled: shop.confettiEnabled
      });

      // Aplicar dados de tasks, habits e goals diretamente ao storage
      const { tasks, habits, goals } = userData.data;
      
      // Aplicar tarefas diretamente ao storage
      if (tasks && Array.isArray(tasks)) {
        await storage.saveTasks(tasks);
      }

      // Aplicar hábitos ao store Zustand
      if (habits && Array.isArray(habits)) {
        // Converter array para object format do store de hábitos
        const habitsObject = habits.reduce((acc: any, habit: any) => {
          acc[habit.id] = habit;
          return acc;
        }, {});
        
        // Salvar no store de hábitos
        await localforage.setItem('dl.habits.v1', {
          state: { habits: habitsObject, logs: {}, habitCategoryOrder: [] },
          version: 0
        });
      }

      // Aplicar metas diretamente ao storage
      if (goals && Array.isArray(goals)) {
        await storage.saveGoals(goals);
      }

      console.log('[UserData] Dados aplicados com sucesso');
    } catch (error) {
      console.error('[UserData] Erro ao aplicar dados:', error);
      throw error;
    }
  }

  // Gerar dados do usuário para relatório (sem usar hooks)
  static async generateUserDataReport(userId: string): Promise<UserDataFile> {
    try {
      // Coletar todos os dados dos stores
      const gamificationData = useGamificationStore.getState();
      const shopData = useShopStore.getState();
      
      // Coletar dados reais diretamente do storage
      const tasks = await storage.getTasks();
      const goals = await storage.getGoals();
      
      // Coletar hábitos do store Zustand de hábitos
      const habitsStoreRaw = await localforage.getItem<any>('dl.habits.v1');
      let habits: any[] = [];
      
      try {
        let habitsStore: any = null;
        
        // Se for string, fazer parse, senão usar diretamente
        if (typeof habitsStoreRaw === 'string') {
          habitsStore = JSON.parse(habitsStoreRaw);
        } else {
          habitsStore = habitsStoreRaw;
        }
        
        if (habitsStore && habitsStore.state && habitsStore.state.habits) {
          habits = Object.values(habitsStore.state.habits);
          
          // Adicionar logs de cada hábito se disponível
          if (habitsStore.state.logs) {
            habits = habits.map(habit => ({
              ...habit,
              logs: habitsStore.state.logs[habit.id] || {}
            }));
          }
        }
      } catch (error) {
        console.error('[UserData] Error parsing habitsStore for report:', error);
        habits = [];
      }
      
      // Contar itens para metadata
      const tasksCount = tasks.length;
      const habitsCount = habits.length;
      const goalsCount = goals.length;
      
      const userData: UserDataFile = {
        userId,
        metadata: {
          createdAt: Date.now(),
          lastUpdated: Date.now(),
          version: this.VERSION,
          totalXp: gamificationData.xp,
          totalCoins: gamificationData.coins,
          tasksCount,
          habitsCount,
          goalsCount,
        },
        data: {
          gamification: {
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
            rankDiv: gamificationData.rankDiv,
            history: gamificationData.history,
            config: gamificationData.config
          },
          tasks: tasks,
          habits: habits,
          goals: goals,
          shop: {
            items: shopData.items,
            confettiEnabled: shopData.confettiEnabled
          }
        }
      };

      return userData;
    } catch (error) {
      console.error('[UserData] Erro ao gerar dados para relatório:', error);
      throw error;
    }
  }

  // Gerar relatório de dados do usuário
  static generateUserReport(userData: UserDataFile): string {
    const { metadata, data } = userData;
    const { gamification, tasks, habits, goals } = data;
    
    // Calcular estatísticas detalhadas
    const completedTasks = tasks.filter(t => t.completed).length;
    const activeHabits = habits.filter(h => h.isActive).length;
    const completedGoals = goals.filter(g => g.isCompleted).length;
    const activeGoals = goals.filter(g => !g.isCompleted && !g.isFuture).length;
    const futureGoals = goals.filter(g => g.isFuture).length;
    
    // Calcular streaks médios dos hábitos
    const avgStreak = habits.length > 0 
      ? Math.round(habits.reduce((sum, h) => sum + h.streak, 0) / habits.length)
      : 0;
    
    // Calcular progresso das metas
    const totalGoalProgress = goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + (g.currentValue / g.targetValue * 100), 0) / goals.length)
      : 0;
    
    return `
=== RELATÓRIO DO USUÁRIO ===
ID: ${userData.userId}
Criado em: ${new Date(metadata.createdAt).toLocaleString()}
Última atualização: ${new Date(metadata.lastUpdated).toLocaleString()}
Versão: ${metadata.version}

=== PROGRESSO GAMIFICAÇÃO ===
XP Total: ${metadata.totalXp}
Moedas: ${metadata.totalCoins}
Rank: ${gamification.rankTier} ${gamification.rankDiv}
Vitalidade: ${gamification.vitality}%

=== ATRIBUTOS ===
Força: ${gamification.str}
Inteligência: ${gamification.int}
Criatividade: ${gamification.cre}
Social: ${gamification.soc}
Aspecto Dominante: ${gamification.aspect}

=== TAREFAS ===
Total: ${metadata.tasksCount}
Concluídas: ${completedTasks}
Pendentes: ${metadata.tasksCount - completedTasks}
Taxa de conclusão: ${metadata.tasksCount > 0 ? Math.round((completedTasks / metadata.tasksCount) * 100) : 0}%

=== HÁBITOS ===
Total: ${metadata.habitsCount}
Ativos: ${activeHabits}
Streak médio: ${avgStreak}
Maior streak: ${habits.length > 0 ? Math.max(...habits.map(h => h.longestStreak)) : 0}

=== METAS ===
Total: ${metadata.goalsCount}
Ativas: ${activeGoals}
Concluídas: ${completedGoals}
Futuras: ${futureGoals}
Progresso médio: ${totalGoalProgress}%

=== HISTÓRICO ===
Ações registradas: ${gamification.history.length}
Última ação: ${gamification.history.length > 0 
  ? new Date(gamification.history[gamification.history.length - 1].ts).toLocaleString()
  : 'Nenhuma'}
    `.trim();
  }
}
