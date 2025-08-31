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
    
    // Verificar se o usuário existe na tabela profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()
    
    if (profileError || !profile) {
      console.error('Usuário não encontrado na tabela profiles:', userId)
      throw new Error('Usuário não encontrado na tabela profiles')
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
        const dates = Array.isArray((habit as any).completedDates) ? (habit as any).completedDates : [];
        for (const date of dates) {
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
        const milestones = Array.isArray(goal.milestones) ? goal.milestones : [];
        for (const milestone of milestones) {
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
    // Verificar se o usuário existe na tabela profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()
    
    if (profileError || !profile) {
      console.error('Usuário não encontrado na tabela profiles:', userId)
      throw new Error('Usuário não encontrado na tabela profiles')
    }

    // SEMPRE criar/atualizar dados de gamificação
    const gamificationData = await db.saveGamificationData({
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

    // SEMPRE criar/atualizar configurações do usuário
    const userSettings = await db.saveUserSettings({
      userId,
      confettiEnabled: false,
      gamificationConfig: {}
    })

    // SEMPRE criar itens da loja padrão
    const defaultShopItems = [
      {
        id: 'xp_boost_1',
        userId,
        name: 'Boost de XP',
        description: 'Ganha 50% mais XP por 1 hora',
        price: 50,
        category: 'vantagens' as const,
        icon: '⚡',
        purchased: false
      },
      {
        id: 'confetti_effect',
        userId,
        name: 'Efeito Confete',
        description: 'Confete dourado ao completar tarefas',
        price: 75,
        category: 'vantagens' as const,
        icon: '🎉',
        purchased: false
      }
    ]

    for (const item of defaultShopItems) {
      await db.saveShopItem(userId, item)
    }

    console.log('Dados do usuário inicializados/atualizados com sucesso')
  } catch (error) {
    console.error('Erro ao inicializar dados do usuário:', error)
    throw error
  }
}
