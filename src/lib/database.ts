import { supabase } from './supabase'
import { Task, Habit, Goal, Milestone } from '@/types'
import type { ShopItem } from '@/types';
import type { Habit as AppHabit, HabitDb } from '@/types';
import type { Task as AppTask, TaskDb, Goal as AppGoal, GoalDb } from '@/types';
import type { 
  GamificationData as AppGamificationData,
  GamificationDb,
  UserSettings as AppUserSettings,
  UserSettingsDb
} from '@/types';

function toHabit(db: HabitDb): AppHabit {
  return {
    id: db.id,
    title: db.title,
    description: db.description ?? '',
    color: db.color ?? '#3B82F6',
    icon_type: db.icon_type,
    icon_value: db.icon_value,
    categories: db.categories ?? [],
    frequency: db.frequency,
    target_days: db.target_days,
    target_count: db.target_count,
    order_index: db.order_index,
    streak: db.streak,
    longest_streak: db.longest_streak,
    is_active: db.is_active,
    created_at: db.created_at,
    updated_at: db.updated_at,
    archived_at: db.archived_at,
    completedDates: db.habit_completions?.map(c => c.completion_date) ?? []
  } as unknown as AppHabit;
}

function toHabitDb(userId: string, habit: AppHabit): HabitDb {
  return {
    id: habit.id,
    user_id: userId,
    title: habit.title,
    description: habit.description,
    color: habit.color,
    icon_type: (habit as any).icon_type,
    icon_value: (habit as any).icon_value,
    categories: (habit as any).categories,
    frequency: habit.frequency,
    target_days: (habit as any).target_days,
    target_count: (habit as any).target_count,
    order_index: (habit as any).order_index,
    streak: habit.streak,
    longest_streak: habit.longestStreak ?? (habit as any).longest_streak,
    is_active: (habit as any).is_active ?? true,
    created_at: habit.createdAt ?? (habit as any).created_at,
    updated_at: new Date().toISOString(),
    archived_at: (habit as any).archived_at
  } as HabitDb;
}

function toTaskDb(userId: string, task: AppTask): TaskDb {
  return {
    id: task.id,
    user_id: userId,
    title: task.title,
    description: task.description,
    bucket: task.bucket,
    completed: task.completed,
    priority: task.priority,
    category: task.category,
    due_date: task.dueDate,
    week_start: task.weekStart,
    week_end: task.weekEnd,
    overdue: task.overdue,
    order_index: task.order,
    created_at: task.createdAt,
    updated_at: new Date().toISOString()
  };
}

function toTask(db: TaskDb): AppTask {
  return {
    id: db.id,
    title: db.title,
    description: db.description,
    bucket: db.bucket,
    completed: db.completed,
    priority: db.priority,
    category: db.category,
    dueDate: db.due_date,
    weekStart: db.week_start,
    weekEnd: db.week_end,
    overdue: db.overdue,
    order: db.order_index,
    createdAt: db.created_at,
    updatedAt: db.updated_at
  };
}

function toGoalDb(userId: string, goal: AppGoal): GoalDb {
  return {
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
    created_at: goal.createdAt,
    updated_at: new Date().toISOString()
  };
}

function toGoal(db: GoalDb): AppGoal {
  return {
    id: db.id,
    title: db.title,
    description: db.description,
    color: db.color,
    iconType: db.icon_type as any,
    iconValue: db.icon_value,
    targetValue: db.target_value,
    currentValue: db.current_value,
    unit: db.unit,
    category: db.category as AppGoal['category'],
    deadline: db.deadline,
    isCompleted: db.is_completed,
    isFuture: db.is_future,
    order: db.order_index,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
    // Map milestones if present
    milestones: (db.milestones || []).map(m => ({
      id: m.id,
      title: m.title,
      value: m.value,
      completed: m.completed,
      completedAt: m.completed_at
    })),
  };
}

function toGamificationDb(data: AppGamificationData): GamificationDb {
  return {
    id: data.id!,
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
  };
}

function toGamification(data: GamificationDb): AppGamificationData {
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
  };
}

function toUserSettingsDb(settings: AppUserSettings): UserSettingsDb {
  return {
    id: settings.id!,
    user_id: settings.userId,
    confetti_enabled: settings.confettiEnabled,
    gamification_config: settings.gamificationConfig,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

function toUserSettings(data: UserSettingsDb): AppUserSettings {
  return {
    id: data.id,
    userId: data.user_id,
    confettiEnabled: data.confetti_enabled,
    gamificationConfig: data.gamification_config
  };
}

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

export interface UserSettings {
  id?: string
  userId: string
  confettiEnabled: boolean
  gamificationConfig: Record<string, any>
}

export class DatabaseService {
  // ===== TASKS =====
  async getTasks(userId: string): Promise<AppTask[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true })

    if (error) throw error

    return (data || []).map(toTask)
  }

  async saveTask(userId: string, task: AppTask): Promise<AppTask> {
    const upsertData = toTaskDb(userId, task)
    const { data, error } = await supabase
      .from('tasks')
      .upsert(upsertData)
      .select()
      .single()

    if (error) throw error

    return toTask(data)
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
      .select(`*, habit_completions(completion_date)`) // relation
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return (habits || []).map(toHabit)
  }

  async saveHabit(userId: string, habit: Habit): Promise<Habit> {
    console.log('🔍 [DEBUG] saveHabit chamado:', { userId, habit });

    const upsertData = toHabitDb(userId, habit as any);

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
  async getGoals(userId: string): Promise<AppGoal[]> {
    const { data: goals, error } = await supabase
      .from('goals')
      .select(`*, milestones(*)`)
      .eq('user_id', userId)
      .order('order_index', { ascending: true })

    if (error) throw error

    return (goals || []).map(toGoal)
  }

  async saveGoal(userId: string, goal: AppGoal): Promise<AppGoal> {
    const upsertData = toGoalDb(userId, goal)
    const { data, error } = await supabase
      .from('goals')
      .upsert(upsertData)
      .select()
      .single()

    if (error) throw error

    return toGoal(data)
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
  async getGamificationData(userId: string): Promise<AppGamificationData | null> {
    const { data, error } = await supabase
      .from('user_gamification')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return toGamification(data as GamificationDb);
  }

  async saveGamificationData(data: AppGamificationData): Promise<AppGamificationData> {
    const dbData = toGamificationDb(data);
    // check existing
    const existing = await this.getGamificationData(data.userId);
    let result;
    if (existing) {
      const { data: d, error } = await supabase
        .from('user_gamification')
        .update(dbData)
        .eq('user_id', data.userId)
        .select()
        .single();
      if (error) throw error;
      result = d as GamificationDb;
    } else {
      const { data: d, error } = await supabase
        .from('user_gamification')
        .insert(dbData)
        .select()
        .single();
      if (error) throw error;
      result = d as GamificationDb;
    }
    return toGamification(result);
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
  async getUserSettings(userId: string): Promise<AppUserSettings | null> {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;
    return toUserSettings(data as UserSettingsDb);
  }

  async saveUserSettings(settings: AppUserSettings): Promise<AppUserSettings> {
    const dbSettings = toUserSettingsDb(settings);
    // check existing
    const existing = await this.getUserSettings(settings.userId);
    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('user_settings')
        .update(dbSettings)
        .eq('user_id', settings.userId)
        .select()
        .single();
      if (error) throw error;
      result = data as UserSettingsDb;
    } else {
      const { data, error } = await supabase
        .from('user_settings')
        .insert(dbSettings)
        .select()
        .single();
      if (error) throw error;
      result = data as UserSettingsDb;
    }
    return toUserSettings(result);
  }
}

export const db = new DatabaseService()
