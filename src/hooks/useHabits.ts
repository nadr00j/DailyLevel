import { useState, useEffect, useCallback } from 'react';
import { useGamificationStoreV21 } from '@/stores/useGamificationStoreV21';
import { Habit, formatLocalDate, isToday } from '@/types';
import { storage } from '@/lib/storage';
import { isToday as isDateToday, parseISO, startOfDay, differenceInDays } from 'date-fns';
import { generateId } from '@/lib/uuid';
import { db } from '@/lib/database';
import { useAuthStore } from '@/stores/useAuthStore';

export const useHabits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHabits = useCallback(async () => {
    try {
      setLoading(true);
      // Load directly from Supabase (no localStorage)
      const userId = useAuthStore.getState().user?.id;
      if (!userId) {
        console.warn('[useHabits] Usuário não autenticado');
        return;
      }
      
      const habits = await db.getHabits(userId);
      setHabits(habits);
      console.log('✅ [useHabits] Hábitos carregados do Supabase:', habits.length);
    } catch (error) {
      console.error('❌ [useHabits] Erro ao carregar hábitos do Supabase:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveHabits = useCallback(async (newHabits: Habit[]) => {
    try {
      // Hábitos são salvos diretamente no Supabase via useHabitStore
      setHabits(newHabits);
      console.log('✅ [useHabits] Hábitos atualizados localmente (salvos via Supabase)');
    } catch (error) {
      console.error('❌ [useHabits] Erro ao atualizar hábitos:', error);
    }
  }, []);

  const addHabit = useCallback(async (habitData: Omit<Habit, 'id' | 'createdAt' | 'updatedAt' | 'streak' | 'longestStreak' | 'completedDates'>) => {
    const now = new Date().toISOString();
    const newHabit: Habit = {
      ...habitData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      streak: 0,
      longestStreak: 0,
      completedDates: []
    };
    
    const updatedHabits = [...habits, newHabit];
    await saveHabits(updatedHabits);
    // Persist new habit to Supabase
    try {
      const userId = useAuthStore.getState().user!.id;
      await db.saveHabit(userId, newHabit);
    } catch (err) {
      console.error('[useHabits] Erro ao salvar novo hábito no Supabase:', err);
    }
    return newHabit;
  }, [habits, saveHabits]);

  const updateHabit = useCallback(async (id: string, updates: Partial<Habit>) => {
    const updatedHabits = habits.map(habit =>
      habit.id === id
        ? { ...habit, ...updates, updatedAt: new Date().toISOString() }
        : habit
    );
    await saveHabits(updatedHabits);
  }, [habits, saveHabits]);

  const deleteHabit = useCallback(async (id: string) => {
    const updatedHabits = habits.filter(habit => habit.id !== id);
    await saveHabits(updatedHabits);
  }, [habits, saveHabits]);

  const calculateStreak = useCallback((completedDates: string[]): number => {
    if (completedDates.length === 0) return 0;

    const sortedDates = completedDates
      .map(date => startOfDay(parseISO(date)))
      .sort((a, b) => b.getTime() - a.getTime());

    let streak = 0;
    const today = startOfDay(new Date());

    for (let i = 0; i < sortedDates.length; i++) {
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);

      if (sortedDates[i].getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }, []);

  const toggleHabit = useCallback(async (id: string, date?: string) => {
    const addXp = useGamificationStoreV21.getState().addXp;
    const targetDate = date || formatLocalDate(new Date());
    
    const updatedHabits = habits.map(habit => {
      if (habit.id !== id) return habit;

      const isCompleted = habit.completedDates.includes(targetDate);
      let newCompletedDates: string[];

      if (isCompleted) {
        // Remove the date
        newCompletedDates = habit.completedDates.filter(d => d !== targetDate);
      } else {
        // Add the date
        newCompletedDates = [...habit.completedDates, targetDate].sort();
        // Removido: A gamificação agora é gerenciada pelo VitalityListener
      }

      const newStreak = calculateStreak(newCompletedDates);
      const newLongestStreak = Math.max(habit.longestStreak, newStreak);

      return {
        ...habit,
        completedDates: newCompletedDates,
        streak: newStreak,
        longestStreak: newLongestStreak,
        updatedAt: new Date().toISOString()
      };
    });

    await saveHabits(updatedHabits);
    // Ensure habit record exists in Supabase
    try {
      const userId = useAuthStore.getState().user!.id;
      // Find the updated habit
      const habitToPersist = updatedHabits.find(h => h.id === id);
      if (habitToPersist) {
        await db.saveHabit(userId, habitToPersist);
      }
    } catch (err) {
      console.error('[useHabits] Erro ao salvar hábito no Supabase antes do log:', err);
    }
    // Persist habit completion/uncompletion to Supabase
    try {
      const userId = useAuthStore.getState().user!.id;
      if (!isCompleted) {
        // Mark completion
        await db.completeHabit(id, targetDate);
      } else {
        // Remove completion
        await db.uncompleteHabit(id, targetDate);
      }
    } catch (err) {
      console.error('[useHabits] Erro ao persistir conclusão de hábito no Supabase:', err);
    }
    // Persist history item to Supabase
    const userId = useAuthStore.getState().user!.id;
    setTimeout(() => {
      const history = useGamificationStoreV21.getState().history;
      const last = history[history.length - 1];
      if (last && last.type === 'habit') {
        db.addHistoryItem(userId, last)
          .catch(err => console.error('[useHabits] Erro ao gravar history_item de hábito:', err));
      }
    }, 0);
  }, [habits, saveHabits, calculateStreak]);

  const isHabitCompletedToday = useCallback((habit: Habit): boolean => {
    const today = formatLocalDate(new Date());
    return habit.completedDates.includes(today);
  }, []);

  const getHabitCompletionRate = useCallback((habit: Habit, days: number = 30): number => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - days);

    let completedDays = 0;
    for (let i = 0; i < days; i++) {
      const checkDate = new Date(startDate);
      checkDate.setDate(startDate.getDate() + i);
      const dateString = formatLocalDate(checkDate);
      
      if (habit.completedDates.includes(dateString)) {
        completedDays++;
      }
    }

    return Math.round((completedDays / days) * 100);
  }, []);

  // Generate heatmap data for a habit
  const getHeatmapData = useCallback((habit: Habit, months: number = 3) => {
    const data: { date: string; completed: boolean }[] = [];
    const now = new Date();
    const totalDays = months * 31; // Approximate

    for (let i = totalDays - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateString = formatLocalDate(date);
      
      data.push({
        date: dateString,
        completed: habit.completedDates.includes(dateString)
      });
    }

    return data;
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  // Computed values
  const activeHabits = habits.filter(habit => habit.isActive);
  const todayCompletedHabits = activeHabits.filter(isHabitCompletedToday);
  const todayPendingHabits = activeHabits.filter(habit => !isHabitCompletedToday(habit));

  return {
    habits,
    activeHabits,
    todayCompletedHabits,
    todayPendingHabits,
    loading,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabit,
    isHabitCompletedToday,
    getHabitCompletionRate,
    getHeatmapData,
    refresh: loadHabits
  };
};