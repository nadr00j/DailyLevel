import { useMemo } from 'react';
import { useHabitStore } from '@/stores/useHabitStore';

// Function to get current date in Brazil timezone (UTC-3)
const getBrazilToday = () => {
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
};

/**
 * Hook para categorizar hábitos entre ativos e inativos
 * Lógica compartilhada entre HabitsView e PerformanceReports
 */
export const useHabitCategories = () => {
  const habitsMap = useHabitStore(s => s.habits);
  const logsMap = useHabitStore(s => s.logs);
  
  const today = new Date();
  const todayDay = today.getDay(); // 0-6
  const monthPrefix = today.toISOString().slice(0, 7); // YYYY-MM
  
  const habits = Object.values(habitsMap);
  const activeHabits = habits.filter(h => !h.archivedAt).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  
  // Lógica para determinar se um hábito está ativo hoje
  const isHabitActiveToday = (habit: any) => {
    if (habit.targetInterval === 'daily') return true;

    if (habit.targetInterval === 'weekly') {
      return habit.activeDays?.includes(todayDay);
    }

    if (habit.targetInterval === 'monthly') {
      const habitLogs = logsMap[habit.id] ?? {};
      const completedDaysInMonth = Object.keys(habitLogs).filter(d => 
        d.startsWith(monthPrefix) && habitLogs[d] > 0
      ).length;
      return completedDaysInMonth < habit.targetCount;
    }

    return true;
  };

  // Memoizar activeHabits para evitar recriação constante
  const memoizedActiveHabits = useMemo(() => activeHabits, [activeHabits.length, activeHabits.map(h => h.id).join(',')]);
  
  const categorizedHabits = useMemo(() => {
    const habitsToday = memoizedActiveHabits.filter(isHabitActiveToday);
    const habitsInactive = memoizedActiveHabits.filter(h => !isHabitActiveToday(h));
    
    return {
      all: memoizedActiveHabits,
      active: habitsToday,
      inactive: habitsInactive
    };
  }, [memoizedActiveHabits, logsMap, todayDay, monthPrefix]);

  return categorizedHabits;
};
