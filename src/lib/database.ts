import { supabase } from './supabase'
import { Task, Goal, Milestone } from '@/types';
import type { Habit as AppHabit } from '@/types/habit';
import type { HabitDb } from '@/types/HabitDb';
import type { ShopItem } from '@/types';
import type { Task as AppTask, TaskDb, Goal as AppGoal, GoalDb } from '@/types';
import type { GamificationData as AppGamificationData } from '@/types/GamificationData';
import type { GamificationDb } from '@/types/GamificationDb';
import type { UserSettings as AppUserSettings } from '@/types';
import type { UserSettingsDb } from '@/types/UserSettingsDb';
import type { HistoryItem, ActionType } from '@/types/gamification';

// Convert HabitDb row to Habit (index.ts) format
function toHabit(db: HabitDb): AppHabit {
  const completedDates = (db as any).habit_completions?.map((c: any) => c.completion_date) || [];
  return {
    id: db.id,
    name: db.title,
    description: db.description || '',
    color: db.color || '#3B82F6',
    iconType: (db.icon_type as any) || 'icon',
    iconValue: (db.icon_value as any) || '',
    categories: db.categories || [],
    targetInterval: db.frequency as any,
    targetCount: db.target_count || 1,
    createdAt: db.created_at,
    archivedAt: db.archived_at,
    activeDays: db.target_days || [],
    order: db.order_index,
    completedDates,
  } as AppHabit;
}

function toHabitDb(userId: string, habit: AppHabit): HabitDb {
  return {
    id: habit.id,
    user_id: userId,
    title: (habit as any).title ?? habit.name,
    description: habit.description,
    color: habit.color,
    icon_type: habit.iconType,
    icon_value: habit.iconValue,
    categories: habit.categories,
    frequency: habit.targetInterval,
    target_days: habit.activeDays,
    target_count: habit.targetCount,
    order_index: habit.order,
    streak: (habit as any).streak ?? 0,
    longest_streak: (habit as any).longestStreak ?? 0,
    is_active: (habit as any).isActive ?? true,
    created_at: habit.createdAt,
    updated_at: new Date().toISOString(),
    archived_at: habit.archivedAt
  } as HabitDb;
}

function toTaskDb(userId: string, task: AppTask): TaskDb {
  const dbObj: any = {
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
    created_at: task.createdAt,
    updated_at: new Date().toISOString()
  };
  // Incluir categoria somente se definimos no supabase
  if (task.category) {
    dbObj.category = task.category;
  }
  return dbObj as TaskDb;
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
    })) || [],
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
    console.log('🔍 [DEBUG] saveTask chamado:', { userId, task });
    const upsertData = toTaskDb(userId, task);
    console.log('🔍 [DEBUG] Dados para upsertTask:', upsertData);
    const { data, error } = await supabase
      .from('tasks')
      .upsert(upsertData)
      .select()
      .single();
    if (error) {
      console.error('❌ [DEBUG] Erro em saveTask:', error);
      throw error;
    }
    console.log('✅ [DEBUG] saveTask sucesso:', data);
    return toTask(data);
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Deletar hábito
  async deleteHabit(userId: string, habitId: string): Promise<void> {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId)

    if (error) throw error
  }

  // Deletar meta
  async deleteGoal(userId: string, goalId: string): Promise<void> {
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId)

    if (error) throw error
  }

  // ===== HABITS =====
  async getHabits(userId: string): Promise<AppHabit[]> {
    const { data: habits, error } = await supabase
      .from('habits')
      .select('*, habit_completions(completion_date)')
      .eq('user_id', userId)
      .order('order_index', { ascending: true });
    if (error) throw error;

    return (habits || []).map(toHabit);
  }

  async saveHabit(userId: string, habit: AppHabit): Promise<AppHabit> {
    console.log('🔍 [DEBUG] saveHabit chamado:', { userId, habit });

    const upsertData = toHabitDb(userId, habit as any);
    console.log('🔍 [DEBUG] upsertData completo:', upsertData);
    console.log('🔍 [DEBUG] Dados para upsert:', upsertData);

    const { data, error } = await supabase
      .from('habits')
      .upsert(upsertData)
      .select(`*, habit_completions(completion_date)`)
      .single();

    if (error) {
      console.error('❌ [DEBUG] Erro no saveHabit:', error);
      throw error;
    }

    console.log('✅ [DEBUG] saveHabit sucesso:', data);

    // map HabitDb to AppHabit
    return {
      id: data.id,
      name: data.title,
      description: data.description ?? '',
      color: data.color || '#3B82F6',
      iconType: data.icon_type as 'icon' | 'emoji',
      iconValue: data.icon_value || '',
      categories: data.categories ?? [],
      targetInterval: data.frequency,
      targetCount: data.target_count ?? 1,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      archivedAt: data.archived_at,
      activeDays: data.target_days,
      order: data.order_index,
      streak: data.streak,
      longestStreak: data.longest_streak,
      completedDates: (data.habit_completions || []).map((c: any) => c.completion_date),
      isActive: data.is_active
    } as AppHabit;
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
    console.log('🔍 [DEBUG] saveGoal chamado:', { userId, goal });
    const upsertData = toGoalDb(userId, goal);
    console.log('🔍 [DEBUG] Dados para upsertGoal:', upsertData);
    const { data, error } = await supabase
      .from('goals')
      .upsert(upsertData)
      .select()
      .single()

    if (error) {
      console.error('❌ [DEBUG] Erro em saveGoal:', error);
      throw error;
    }
    console.log('✅ [DEBUG] saveGoal sucesso:', data);
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

  // Obter histórico de gamificação (XP, coins, tags, category) do usuário
  async getGamificationHistory(userId: string): Promise<HistoryItem[]> {
    const { data, error } = await supabase
      .from('gamification_history')
      .select('type, xp, coins, tags, category, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) throw error

    return (data || []).map(item => ({
      ts: new Date(item.created_at).getTime(),
      type: item.type as ActionType,
      xp: item.xp,
      coins: item.coins,
      tags: item.tags || [],
      category: item.category || undefined
    }))
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

  async saveShopItem(userId: string, item: ShopItem): Promise<ShopItem> {
    const { data, error } = await supabase
      .from('shop_items')
      .upsert({
        id: item.id,
        user_id: userId,
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
