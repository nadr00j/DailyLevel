import { db } from './database'
import { storage } from './storage'
import { supabase } from './supabase'

export interface MigrationResult {
  success: boolean
  message: string
  migratedData?: {
    tasks: number
    habits: number
    goals: number
  }
}

export async function migrateLocalDataToSupabase(userId: string): Promise<MigrationResult> {
  try {
    console.log('Iniciando migração dos dados locais para Supabase...')
    
    // Verificar se o usuário já tem dados no Supabase
    const existingTasks = await db.getTasks(userId)
    const existingHabits = await db.getHabits(userId)
    const existingGoals = await db.getGoals(userId)
    
    if (existingTasks.length > 0 || existingHabits.length > 0 || existingGoals.length > 0) {
      return {
        success: false,
        message: 'Usuário já possui dados no Supabase. Migração não necessária.'
      }
    }

    // Migrar tarefas
    const tasks = await storage.getTasks()
    let migratedTasks = 0
    for (const task of tasks) {
      try {
        await db.saveTask(userId, task)
        migratedTasks++
      } catch (error) {
        console.error('Erro ao migrar tarefa:', task.id, error)
      }
    }

    // Migrar hábitos
    const habits = await storage.getHabits()
    let migratedHabits = 0
    for (const habit of habits) {
      try {
        const savedHabit = await db.saveHabit(userId, habit)
        
        // Migrar datas de conclusão
        for (const date of habit.completedDates) {
          try {
            await db.completeHabit(savedHabit.id, date)
          } catch (error) {
            console.error('Erro ao migrar conclusão de hábito:', date, error)
          }
        }
        
        migratedHabits++
      } catch (error) {
        console.error('Erro ao migrar hábito:', habit.id, error)
      }
    }

    // Migrar metas
    const goals = await storage.getGoals()
    let migratedGoals = 0
    for (const goal of goals) {
      try {
        const savedGoal = await db.saveGoal(userId, goal)
        
        // Migrar marcos
        for (const milestone of goal.milestones) {
          try {
            await db.saveMilestone(savedGoal.id, milestone)
          } catch (error) {
            console.error('Erro ao migrar marco:', milestone.id, error)
          }
        }
        
        migratedGoals++
      } catch (error) {
        console.error('Erro ao migrar meta:', goal.id, error)
      }
    }

    // Criar dados de gamificação padrão se não existirem
    const gamificationData = await db.getGamificationData(userId)
    if (!gamificationData) {
      await db.saveGamificationData({
        userId,
        xp: 0,
        coins: 0,
        xp30d: 0,
        vitality: 100,
        mood: 'neutral',
        xpMultiplier: 1.0,
        xpMultiplierExpiry: 0,
        str: 0,
        int: 0,
        cre: 0,
        soc: 0,
        aspect: 'int',
        rankIdx: 0,
        rankTier: 'Bronze',
        rankDiv: 1
      })
    }

    // Criar configurações padrão do usuário
    const userSettings = await db.getUserSettings(userId)
    if (!userSettings) {
      await db.saveUserSettings({
        userId,
        confettiEnabled: false,
        gamificationConfig: {}
      })
    }

    console.log('Migração concluída com sucesso!')
    
    return {
      success: true,
      message: 'Migração concluída com sucesso!',
      migratedData: {
        tasks: migratedTasks,
        habits: migratedHabits,
        goals: migratedGoals
      }
    }
  } catch (error) {
    console.error('Erro na migração:', error)
    return {
      success: false,
      message: `Erro na migração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    }
  }
}

export async function createUserProfile(userId: string, username: string, displayName?: string) {
  try {
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        username,
        display_name: displayName || username
      })
    
    if (error) throw error
    
    console.log('Perfil do usuário criado com sucesso')
  } catch (error) {
    console.error('Erro ao criar perfil do usuário:', error)
    throw error
  }
}

export async function initializeUserData(userId: string) {
  try {
    // Verificar se já existe dados de gamificação
    let gamificationData = await db.getGamificationData(userId)
    
    if (!gamificationData) {
      // Criar dados de gamificação padrão
      gamificationData = await db.saveGamificationData({
        userId,
        xp: 0,
        coins: 0,
        xp30d: 0,
        vitality: 100,
        mood: 'neutral',
        xpMultiplier: 1.0,
        xpMultiplierExpiry: 0,
        str: 0,
        int: 0,
        cre: 0,
        soc: 0,
        aspect: 'int',
        rankIdx: 0,
        rankTier: 'Bronze',
        rankDiv: 1
      })
    }

    // Verificar se já existe configurações do usuário
    let userSettings = await db.getUserSettings(userId)
    
    if (!userSettings) {
      // Criar configurações padrão
      userSettings = await db.saveUserSettings({
        userId,
        confettiEnabled: false,
        gamificationConfig: {}
      })
    }

    // Criar itens da loja padrão se não existirem
    const shopItems = await db.getShopItems(userId)
    
    if (shopItems.length === 0) {
      const defaultShopItems = [
        {
          userId,
          name: 'Boost de XP',
          description: 'Ganha 50% mais XP por 1 hora',
          price: 50,
          category: 'boost' as const,
          icon: '⚡',
          purchased: false
        },
        {
          userId,
          name: 'Efeito Confete',
          description: 'Confete dourado ao completar tarefas',
          price: 75,
          category: 'cosmetic' as const,
          icon: '🎉',
          purchased: false
        }
      ]

      for (const item of defaultShopItems) {
        await db.saveShopItem(item)
      }
    }

    console.log('Dados do usuário inicializados com sucesso')
  } catch (error) {
    console.error('Erro ao inicializar dados do usuário:', error)
    throw error
  }
}
