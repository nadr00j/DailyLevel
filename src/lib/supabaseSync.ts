import { supabase } from './supabase';
import { storage } from './storage';
import { db } from './database';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useShopStore } from '@/stores/useShopStore';
import localforage from 'localforage';

export async function loadDataFromSupabase(userId: string): Promise<void> {
  try {
    console.log('Carregando dados do Supabase para o usuário:', userId);
    
    // 1. Carregar dados de gamificação
    const gamificationData = await db.getGamificationData(userId);
    if (gamificationData) {
      console.log('Dados de gamificação carregados:', gamificationData);
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
      console.log('Configurações do usuário carregadas:', userSettings);
      useShopStore.setState({
        confettiEnabled: userSettings.confettiEnabled
      });
    }

    // 3. Carregar tarefas
    const tasks = await db.getTasks(userId);
    if (tasks && tasks.length > 0) {
      console.log('Tarefas carregadas:', tasks.length);
      await storage.saveTasks(tasks);
    }

    // 4. Carregar hábitos
    const habits = await db.getHabits(userId);
    if (habits && habits.length > 0) {
      console.log('Hábitos carregados:', habits.length);
      await storage.saveHabits(habits);
      
      // Converter para o formato do store de hábitos
      const habitsObject = habits.reduce((acc: any, habit: any) => {
        acc[habit.id] = habit;
        return acc;
      }, {});
      
      await localforage.setItem('dl.habits.v1', {
        state: { habits: habitsObject, logs: {}, habitCategoryOrder: [] },
        version: 0
      });
    }

    // 5. Carregar metas
    const goals = await db.getGoals(userId);
    if (goals && goals.length > 0) {
      console.log('Metas carregadas:', goals.length);
      await storage.saveGoals(goals);
    }

    // 6. Carregar itens da loja
    const shopItems = await db.getShopItems(userId);
    if (shopItems && shopItems.length > 0) {
      console.log('Itens da loja carregados:', shopItems.length);
      useShopStore.setState({
        items: shopItems
      });
    }

    console.log('Todos os dados foram carregados do Supabase com sucesso!');
    
  } catch (error) {
    console.error('Erro ao carregar dados do Supabase:', error);
    throw error;
  }
}

export async function syncDataToSupabase(userId: string): Promise<void> {
  try {
    console.log('Sincronizando dados locais para o Supabase...');
    
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

    console.log('Dados sincronizados para o Supabase com sucesso!');
    
  } catch (error) {
    console.error('Erro ao sincronizar dados para o Supabase:', error);
    throw error;
  }
}
