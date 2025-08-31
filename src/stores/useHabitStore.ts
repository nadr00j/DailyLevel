import { create } from 'zustand';
import type { Habit, HabitLog } from '@/types/habit';
import { generateId } from '@/lib/uuid';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { dataSyncService } from '@/lib/DataSyncService';

interface HabitState {
  habits: Record<string, Habit>;
  logs: Record<string, Record<string, number>>; // habitId -> date -> count
  habitCategoryOrder: string[];

  // actions
  createHabit: (h: Omit<Habit, 'id' | 'createdAt'>) => string;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  listHabits: () => Habit[];
  logCompletion: (habitId: string, date: string) => void;
  decrementCompletion: (habitId: string, date: string) => void;
  getLogs: (habitId: string, since: Date, days: number) => HabitLog[];
  getProgressForDate: (habitId: string, date: string) => { count: number; targetCount: number; ratio: number } | null;
  setCategoryOrder: (order: string[]) => void;
  reorderHabits: (ordered: Habit[]) => void;
}

export const useHabitStore = create<HabitState>((set, get) => ({
      habits: {},
      logs: {},
      habitCategoryOrder: [],

      createHabit: (input) => {
        const id = generateId();
        const createdAt = new Date().toISOString().slice(0,10); // Assuming date-fns is removed, use current date
        const currentHabits = get().habits;
        const order = Object.keys(currentHabits).length;
        const habit: Habit = { id, createdAt, targetInterval: 'daily', targetCount: 1, categories: [], order, ...input } as Habit;
        console.log('🔍 [DEBUG] createHabit chamado:', { input, habit });
        set(state => ({ habits: { ...state.habits, [id]: habit } }));
        // sync após criação
        const userId = useAuthStore.getState().user!.id;
        dataSyncService.syncAll(userId);
        return id;
      },

      updateHabit: (id, patch) => {
        console.log('🔍 [DEBUG] updateHabit chamado:', { id, patch });
        set(state => {
          if (!state.habits[id]) {
            console.log('❌ [DEBUG] Hábito não encontrado:', id);
            return state;
          }
          // remover propriedades undefined para não sobrescrever valores existentes
          const cleanedPatch = Object.fromEntries(
            Object.entries(patch).filter(([_, v]) => v !== undefined)
          ) as Partial<Habit>;
          const updatedHabit = { ...state.habits[id], ...cleanedPatch };
          console.log('🔍 [DEBUG] Hábito atualizado:', { 
            id, 
            before: state.habits[id], 
            after: updatedHabit 
          });
          return { habits: { ...state.habits, [id]: updatedHabit } };
        });
        // sync após atualização
        const userId = useAuthStore.getState().user!.id;
        dataSyncService.syncAll(userId);
      },

      deleteHabit: (id) => {
        set(state => {
          const { [id]: _, ...rest } = state.habits;
          const { [id]: __, ...logRest } = state.logs;
          return { habits: rest, logs: logRest };
        });
        // sync após exclusão
        const userId = useAuthStore.getState().user!.id;
        dataSyncService.syncAll(userId);
      },

      listHabits: () => {
        return Object.values(get().habits);
      },

      logCompletion: (habitId, date) => {
        console.log('[HabitStore Debug] logCompletion chamado:', { habitId, date });
        
        const addXp = useGamificationStore.getState().addXp;
        set(state => {
          const habitLogs = state.logs[habitId] ?? {};
          const current = habitLogs[date] ?? 0;

          // depois do incremento
          const newCount = current + 1;
          console.log('[HabitStore Debug] Incrementando contador:', { current, newCount });

          // conceder XP apenas quando atinge targetCount completo
          const habit = state.habits[habitId];
          const today = new Date().toISOString().slice(0,10);
          
          console.log('[HabitStore Debug] Verificando condições:', { 
            hasHabit: !!habit, 
            newCount,
            targetCount: habit?.targetCount,
            date, 
            today,
            isToday: date === today,
            isComplete: newCount === habit?.targetCount
          });
          
          if (habit && newCount === habit.targetCount && date === today) {
            console.log('[Habit Debug] Hábito completado! Concedendo XP:', habit.name, 'categorias:', habit.categories);
            addXp('habit', habit.categories || []);
          }

          return {
            logs: {
              ...state.logs,
              [habitId]: { ...habitLogs, [date]: newCount },
            },
          };
        });
      },

      decrementCompletion: (habitId, date) => {
        set(state => {
          const habitLogs = state.logs[habitId] ?? {};
          const current = habitLogs[date] ?? 0;
          return {
            logs: {
              ...state.logs,
              [habitId]: { ...habitLogs, [date]: Math.max(0, current - 1) },
            },
          };
        });
      },

      getLogs: (habitId, since, days) => {
        const result: HabitLog[] = [];
        const habitLogs = get().logs[habitId] ?? {};
        for (let i = 0; i < days; i++) {
          const d = new Date(since);
          d.setDate(d.getDate() + i);
          const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
          result.push({ date: key, count: habitLogs[key] ?? 0 });
        }
        return result;
      },

      getProgressForDate: (habitId, date) => {
        const habit = get().habits[habitId];
        if (!habit) {
          return null;
        }
        const count = (get().logs[habitId]?.[date]) ?? 0;
        const ratio = Math.min(1, count / habit.targetCount);
        return { count, targetCount: habit.targetCount, ratio };
      },

      setCategoryOrder: (order)=>{
        set({ habitCategoryOrder: order });
      },

      reorderHabits: (ordered) => {
        set(state => {
          const map = new Map<string, Habit>();
          ordered.forEach((h, idx) => map.set(h.id, { ...h, order: idx }));

          const newHabits: Record<string, Habit> = {};
          // maintain new insertion order according to ordered list then others
          ordered.forEach(h => {
            newHabits[h.id] = map.get(h.id)!;
          });
          // include any other habits not in list (archived) without changing
          Object.values(state.habits).forEach(h=>{
            if(!newHabits[h.id]) newHabits[h.id]=h;
          });
          return { habits: newHabits };
        });
      },
    }));
