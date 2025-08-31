import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '@/lib/storage';
import type { Goal } from '@/types';

interface GoalState {
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (goal: Goal) => void;
  removeGoal: (goalId: string) => void;
  clearGoals: () => void;
}

export const useGoalStore = create<GoalState>()(
  persist(
    (set, get) => ({
      goals: [],
      setGoals: (goals) => {
        set({ goals });
        storage.saveGoals(goals);
      },
      addGoal: (goal) => {
        const goals = [...get().goals, goal];
        set({ goals });
        storage.saveGoals(goals);
      },
      updateGoal: (goal) => {
        const goals = get().goals.map(g => g.id === goal.id ? goal : g);
        set({ goals });
        storage.saveGoals(goals);
      },
      removeGoal: (goalId) => {
        const goals = get().goals.filter(g => g.id !== goalId);
        set({ goals });
        storage.saveGoals(goals);
      },
      clearGoals: () => {
        set({ goals: [] });
        storage.saveGoals([]);
      }
    }),
    {
      name: 'dl.goals.v1',
      storage: createJSONStorage(() => localforage)
    }
  )
);


