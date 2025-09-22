import { create } from 'zustand';
import type { Habit, HabitLog } from '@/types/habit';
import { generateId } from '@/lib/uuid';
import { useGamificationStoreV21 } from '@/stores/useGamificationStoreV21';
import { useAuthStore } from '@/stores/useAuthStore';
import { db } from '@/lib/database';
import { dataSyncService } from '@/lib/DataSyncService';

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

// Function to format date in Brazil timezone
const formatDateBrazil = (date: Date) => {
  const brazilOffset = -3 * 60; // -3 hours in minutes
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const brazilTime = new Date(utc + (brazilOffset * 60000));
  
  const year = brazilTime.getFullYear();
  const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brazilTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

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
      habitCategoryOrder: typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('dl.habitCategoryOrder') || '[]')
        : [],

      createHabit: (input) => {
        const id = generateId();
        const createdAt = getBrazilToday(); // Use Brazil timezone
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
        const addXp = useGamificationStoreV21.getState().addXp;
        const userId = useAuthStore.getState().user!.id;
        
        // Incrementa localmente
        set(state => {
          const habitLogs = state.logs[habitId] ?? {};
          const current = habitLogs[date] ?? 0;
          const newCount = current + 1;
          console.log('[HabitStore Debug] Incrementando contador:', { current, newCount });
          
          // Verifica se completou o hábito hoje
          const habit = state.habits[habitId];
          const today = getBrazilToday(); // Use Brazil timezone
          const isCompleted = habit && newCount === habit.targetCount && date === today;
          
          console.log('[HabitStore Debug] Verificando conclusão:', { 
            hasHabit: !!habit, 
            newCount, 
            targetCount: habit?.targetCount, 
            isCompleted 
          });
          
          // Se completou o hábito, registra XP e coins
          if (isCompleted) {
            const us = useGamificationStoreV21.getState();
            const habitXp = us.config.points.habit;
            const habitCoins = Math.floor(habitXp * 0.1); // 10% do XP
            console.log('[HabitStore] Hábito completado! Registrando histórico com:', { xp: habitXp, coins: habitCoins });
            
            // Registra no histórico
            db.addHistoryItem(userId, {
              ts: Date.now(),
              type: 'habit',
              xp: habitXp,
              coins: habitCoins,
              category: habit.categories?.[0],
              tags: [habit.name]
            }).catch(err => console.error('[HabitStore] Erro ao registrar histórico de hábito:', err));
            
            // Removido: A gamificação agora é gerenciada pelo VitalityListener
          }
          
          // Atualiza logs
          return { logs: { ...state.logs, [habitId]: { ...habitLogs, [date]: newCount } } };
        });
        
        // Salva conclusão no Supabase
        db.completeHabit(habitId, date).catch(error => console.error('[HabitStore Debug] Erro ao salvar conclusão de hábito:', error));
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
        // Sync this un-completion to Supabase
        db.uncompleteHabit(habitId, date).catch(error => {
          console.error('[HabitStore Debug] Erro ao remover conclusão de hábito:', error);
        });
      },

      getLogs: (habitId, since, days) => {
        const result: HabitLog[] = [];
        const habitLogs = get().logs[habitId] ?? {};
        for (let i = 0; i < days; i++) {
          const d = new Date(since);
          d.setDate(d.getDate() + i);
          const key = formatDateBrazil(d); // Use Brazil timezone
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
        // Persist category order to Supabase via full sync
        const user = useAuthStore.getState().user;
        if (user) {
          dataSyncService.syncAll(user.id).catch(err => console.error('[HabitStore Debug] Erro ao sincronizar setCategoryOrder:', err));
        }
      },

      reorderHabits: (ordered) => {
        set(state => {
          // Only update order_index of provided habits, keep others intact
          const updatedHabits = { ...state.habits };
          ordered.forEach((h, idx) => {
            const existing = updatedHabits[h.id];
            if (existing) {
              updatedHabits[h.id] = { ...existing, order: idx };
            }
          });
          return { habits: updatedHabits };
        });
        // Persist reorder to Supabase
        const user = useAuthStore.getState().user;
        if (user) {
          dataSyncService.syncAll(user.id).catch(err => console.error('[HabitStore Debug] Erro ao sincronizar reorderHabits:', err));
        }
      },
    }));
