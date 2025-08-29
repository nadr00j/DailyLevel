import { supabase } from './supabase'
import { Task, Habit, Goal, Milestone } from '@/types'

export interface GamificationData {
  id?: string
  userId: string
  xp: number
  coins: number
  xp30d: number
  vitality: number
  mood: string
  xpMultiplier: number
  xpMultiplierExpiry: number
  str: number
  int: number
  cre: number
  soc: number
  aspect: string
  rankIdx: number
  rankTier: string
  rankDiv: number
}

export interface GamificationHistory {
  id?: string
  userId: string
  type: 'task' | 'habit' | 'milestone' | 'goal'
  xp: number
  coins: number
  tags?: string[]
  category?: string
  createdAt?: string
}

export interface ShopItem {
  id?: string
  userId: string
  name: string
  description?: string
  price: number
  category: 'boost' | 'cosmetic' | 'utility'
  icon?: string
  purchased: boolean
}

export interface UserSettings {
  id?: string
  userId: string
  confettiEnabled: boolean
  gamificationConfig: Record<string, any>
}

export class DatabaseService {
  // ===== TASKS =====
  async getTasks(userId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true })
    
    if (error) throw error
    
    return (data || []).map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      bucket: task.bucket,
      completed: task.completed,
      priority: task.priority,
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      dueDate: task.due_date,
      weekStart: task.week_start,
      weekEnd: task.week_end,
      overdue: task.overdue,
      order: task.order_index
    }))
  }

  async saveTask(userId: string, task: Task): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .upsert({
        id: task.id,
        user_id: userId,
        title: task.title,
        description: task.description,
        bucket: task.bucket,
        completed: task.completed,
        priority: task.priority,
        due_date: task.dueDate,
        week_start: task.weekStart,
        week_end: task.weekEnd,
        overdue: task.overdue,
        order_index: task.order,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      bucket: data.bucket,
      completed: data.completed,
      priority: data.priority,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      dueDate: data.due_date,
      weekStart: data.week_start,
      weekEnd: data.week_end,
      overdue: data.overdue,
      order: data.order_index
    }
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId)
    
    if (error) throw error
  }

  // ===== HABITS =====
  async getHabits(userId: string): Promise<Habit[]> {
    const { data: habits, error } = await supabase
      .from('habits')
      .select(`
        *,
        habit_completions(completion_date)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    return (habits || []).map(habit => ({
      id: habit.id,
      title: habit.title,
      description: habit.description,
      color: habit.color,
      frequency: habit.frequency,
      targetDays: habit.target_days,
      streak: habit.streak,
      longestStreak: habit.longest_streak,
      completedDates: habit.habit_completions?.map((c: any) => c.completion_date) || [],
      createdAt: habit.created_at,
      updatedAt: habit.updated_at,
      isActive: habit.is_active
    }))
  }

  async saveHabit(userId: string, habit: Habit): Promise<Habit> {
    console.log('🔍 [DEBUG] saveHabit chamado:', { userId, habit });
    
    const upsertData = {
      id: habit.id,
      user_id: userId,
      title: habit.title,
      description: habit.description,
      color: habit.color,
      icon_type: habit.icon_type,
      icon_value: habit.icon_value,
      categories: habit.categories,
      frequency: habit.frequency,
      target_days: habit.target_days,
      target_count: habit.target_count,
      order_index: habit.order_index,
      streak: habit.streak,
      longest_streak: habit.longest_streak,
      is_active: habit.is_active,
      created_at: habit.created_at,
      updated_at: new Date().toISOString()
    };
    
    console.log('🔍 [DEBUG] Dados para upsert:', upsertData);
    
    const { data, error } = await supabase
      .from('habits')
      .upsert(upsertData)
      .select()
      .single()
    
    if (error) {
      console.error('❌ [DEBUG] Erro no saveHabit:', error);
      throw error;
    }
    
    console.log('✅ [DEBUG] saveHabit sucesso:', data);
    
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      color: data.color || '#3B82F6', // Default color if column doesn't exist
      frequency: data.frequency,
      targetDays: data.target_days,
      streak: data.streak,
      longestStreak: data.longest_streak,
      completedDates: [], // Will be loaded separately
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isActive: data.is_active
    }
  }

  async completeHabit(habitId: string, date: string): Promise<void> {
    const { error } = await supabase
      .from('habit_completions')
      .upsert({
        habit_id: habitId,
        completion_date: date
      })
    
    if (error) throw error
  }

  async uncompleteHabit(habitId: string, date: string): Promise<void> {
    const { error } = await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', habitId)
      .eq('completion_date', date)
    
    if (error) throw error
  }

  // ===== GOALS =====
  async getGoals(userId: string): Promise<Goal[]> {
    const { data: goals, error } = await supabase
      .from('goals')
      .select(`
        *,
        milestones(*)
      `)
      .eq('user_id', userId)
      .order('order_index', { ascending: true })
    
    if (error) throw error
    
    return (goals || []).map(goal => ({
      id: goal.id,
      title: goal.title,
      description: goal.description,
      color: goal.color,
      iconType: goal.icon_type,
      iconValue: goal.icon_value,
      targetValue: goal.target_value,
      currentValue: goal.current_value,
      unit: goal.unit,
      category: goal.category,
      deadline: goal.deadline,
      milestones: (goal.milestones || []).map((milestone: any) => ({
        id: milestone.id,
        title: milestone.title,
        value: milestone.value,
        completed: milestone.completed,
        completedAt: milestone.completed_at
      })),
      order: goal.order_index,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at,
      isCompleted: goal.is_completed,
      isFuture: goal.is_future
    }))
  }

  async saveGoal(userId: string, goal: Goal): Promise<Goal> {
    const { data, error } = await supabase
      .from('goals')
      .upsert({
        id: goal.id,
        user_id: userId,
        title: goal.title,
        description: goal.description,
        color: goal.color,
        icon_type: goal.iconType,
        icon_value: goal.iconValue,
        target_value: goal.targetValue,
        current_value: goal.currentValue,
        unit: goal.unit,
        category: goal.category,
        deadline: goal.deadline,
        is_completed: goal.isCompleted,
        is_future: goal.isFuture,
        order_index: goal.order,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      color: data.color,
      iconType: data.icon_type,
      iconValue: data.icon_value,
      targetValue: data.target_value,
      currentValue: data.current_value,
      unit: data.unit,
      category: data.category,
      deadline: data.deadline,
      milestones: [], // Will be loaded separately
      order: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      isCompleted: data.is_completed,
      isFuture: data.is_future
    }
  }

  async saveMilestone(goalId: string, milestone: Milestone): Promise<Milestone> {
    const { data, error } = await supabase
      .from('milestones')
      .upsert({
        id: milestone.id,
        goal_id: goalId,
        title: milestone.title,
        value: milestone.value,
        completed: milestone.completed,
        completed_at: milestone.completedAt
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      id: data.id,
      title: data.title,
      value: data.value,
      completed: data.completed,
      completedAt: data.completed_at
    }
  }

  // ===== GAMIFICATION =====
  async getGamificationData(userId: string): Promise<GamificationData | null> {
    const { data, error } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    if (!data) return null
    
    return {
      id: data.id,
      userId: data.user_id,
      xp: data.xp,
      coins: data.coins,
      xp30d: data.xp30d,
      vitality: data.vitality,
      mood: data.mood,
      xpMultiplier: data.xp_multiplier,
      xpMultiplierExpiry: data.xp_multiplier_expiry,
      str: data.str,
      int: data.int,
      cre: data.cre,
      soc: data.soc,
      aspect: data.aspect,
      rankIdx: data.rank_idx,
      rankTier: data.rank_tier,
      rankDiv: data.rank_div
    }
  }

  async saveGamificationData(data: GamificationData): Promise<GamificationData> {
    // Primeiro, verificar se já existe um registro para este usuário
    const existingData = await this.getGamificationData(data.userId)
    
    if (existingData) {
      // Se existe, fazer update
      const { data: result, error } = await supabase
        .from('user_gamification')
        .update({
          xp: data.xp,
          coins: data.coins,
          xp30d: data.xp30d,
          vitality: data.vitality,
          mood: data.mood,
          xp_multiplier: data.xpMultiplier,
          xp_multiplier_expiry: data.xpMultiplierExpiry,
          str: data.str,
          int: data.int,
          cre: data.cre,
          soc: data.soc,
          aspect: data.aspect,
          rank_idx: data.rankIdx,
          rank_tier: data.rankTier,
          rank_div: data.rankDiv,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', data.userId)
        .select()
        .single()
      
      if (error) throw error
      
      return {
        id: result.id,
        userId: result.user_id,
        xp: result.xp,
        coins: result.coins,
        xp30d: result.xp30d,
        vitality: result.vitality,
        mood: result.mood,
        xpMultiplier: result.xp_multiplier,
        xpMultiplierExpiry: result.xp_multiplier_expiry,
        str: result.str,
        int: result.int,
        cre: result.cre,
        soc: result.soc,
        aspect: result.aspect,
        rankIdx: result.rank_idx,
        rankTier: result.rank_tier,
        rankDiv: result.rank_div
      }
    } else {
      // Se não existe, fazer insert
      const { data: result, error } = await supabase
        .from('user_gamification')
        .insert({
          user_id: data.userId,
          xp: data.xp,
          coins: data.coins,
          xp30d: data.xp30d,
          vitality: data.vitality,
          mood: data.mood,
          xp_multiplier: data.xpMultiplier,
          xp_multiplier_expiry: data.xpMultiplierExpiry,
          str: data.str,
          int: data.int,
          cre: data.cre,
          soc: data.soc,
          aspect: data.aspect,
          rank_idx: data.rankIdx,
          rank_tier: data.rankTier,
          rank_div: data.rankDiv,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      
      return {
        id: result.id,
        userId: result.user_id,
        xp: result.xp,
        coins: result.coins,
        xp30d: result.xp30d,
        vitality: result.vitality,
        mood: result.mood,
        xpMultiplier: result.xp_multiplier,
        xpMultiplierExpiry: result.xp_multiplier_expiry,
        str: result.str,
        int: result.int,
        cre: result.cre,
        soc: result.soc,
        aspect: result.aspect,
        rankIdx: result.rank_idx,
        rankTier: result.rank_tier,
        rankDiv: result.rank_div
      }
    }
  }

  async addGamificationHistory(history: GamificationHistory): Promise<void> {
    const { error } = await supabase
      .from('gamification_history')
      .insert({
        user_id: history.userId,
        type: history.type,
        xp: history.xp,
        coins: history.coins,
        tags: history.tags,
        category: history.category
      })
    
    if (error) throw error
  }

  // ===== SHOP =====
  async getShopItems(userId: string): Promise<ShopItem[]> {
    const { data, error } = await supabase
      .from('shop_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    return (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      icon: item.icon,
      purchased: item.purchased
    }))
  }

  async saveShopItem(item: ShopItem): Promise<ShopItem> {
    const { data, error } = await supabase
      .from('shop_items')
      .upsert({
        id: item.id,
        user_id: item.userId,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        icon: item.icon,
        purchased: item.purchased
      })
      .select()
      .single()
    
    if (error) throw error
    
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      description: data.description,
      price: data.price,
      category: data.category,
      icon: data.icon,
      purchased: data.purchased
    }
  }

  // ===== USER SETTINGS =====
  async getUserSettings(userId: string): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    
    if (!data) return null
    
    return {
      id: data.id,
      userId: data.user_id,
      confettiEnabled: data.confetti_enabled,
      gamificationConfig: data.gamification_config
    }
  }

  async saveUserSettings(settings: UserSettings): Promise<UserSettings> {
    // Primeiro, verificar se já existe um registro para este usuário
    const existingSettings = await this.getUserSettings(settings.userId)
    
    if (existingSettings) {
      // Se existe, fazer update
      const { data, error } = await supabase
        .from('user_settings')
        .update({
          confetti_enabled: settings.confettiEnabled,
          gamification_config: settings.gamificationConfig,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', settings.userId)
        .select()
        .single()
      
      if (error) throw error
      
      return {
        id: data.id,
        userId: data.user_id,
        confettiEnabled: data.confetti_enabled,
        gamificationConfig: data.gamification_config
      }
    } else {
      // Se não existe, fazer insert
      const { data, error } = await supabase
        .from('user_settings')
        .insert({
          user_id: settings.userId,
          confetti_enabled: settings.confettiEnabled,
          gamification_config: settings.gamificationConfig,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) throw error
      
      return {
        id: data.id,
        userId: data.user_id,
        confettiEnabled: data.confetti_enabled,
        gamificationConfig: data.gamification_config
      }
    }
  }
}

export const db = new DatabaseService()
