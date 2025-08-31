import { create } from 'zustand';
import { useAuthStore } from '@/stores/useAuthStore';
import { dataSyncService } from '@/lib/DataSyncService';
import { generateId } from '@/lib/uuid';
import type { Goal } from '@/types';

interface GoalState {
  goals: Goal[];
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (goal: Goal) => void;
  removeGoal: (goalId: string) => void;
  clearGoals: () => void;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  setGoals: (goals) => { set({ goals }); },
  addGoal: (goal) => {
    console.log('🔍 [DEBUG] useGoalStore.addGoal - Função chamada com:', goal);
    if (!goal || !goal.title) {
      console.error('❌ [DEBUG] useGoalStore.addGoal - Meta inválida:', goal);
      return;
    }
    
    // Gerar ID se não existir
    const goalWithId = {
      ...goal,
      id: goal.id || generateId(),
      createdAt: goal.createdAt || new Date().toISOString(),
      updatedAt: goal.updatedAt || new Date().toISOString(),
      currentValue: goal.currentValue || 0,
      isCompleted: goal.isCompleted || false,
      milestones: goal.milestones || []
    };
    
    const goalsArr = [...get().goals, goalWithId]; 
    set({ goals: goalsArr });
    console.log('✅ [DEBUG] useGoalStore.addGoal - Meta adicionada ao store:', goalWithId.title, goalWithId.id);
    
    // useAutoSync irá detectar a mudança e sincronizar automaticamente
    console.log('🔍 [DEBUG] useGoalStore.addGoal - Meta adicionada, useAutoSync irá sincronizar automaticamente');
  },
  updateGoal: (goal) => {
    if (!goal || !goal.id) {
      console.error('❌ [DEBUG] useGoalStore.updateGoal - Meta inválida:', goal);
      return;
    }
    
    const goalWithTimestamp = {
      ...goal,
      updatedAt: new Date().toISOString()
    };
    
    const goalsArr = get().goals.map(g => g.id === goal.id ? goalWithTimestamp : g); 
    set({ goals: goalsArr });
    console.log('✅ [DEBUG] useGoalStore.updateGoal - Meta atualizada no store:', goal.title, goal.id);
    console.log('🔍 [DEBUG] useGoalStore.updateGoal - Meta atualizada, useAutoSync irá sincronizar automaticamente');
  },
  removeGoal: (goalId) => {
    const goalsArr = get().goals.filter(g => g.id !== goalId); 
    set({ goals: goalsArr });
    console.log('✅ [DEBUG] useGoalStore.removeGoal - Meta removida do store:', goalId);
    console.log('🔍 [DEBUG] useGoalStore.removeGoal - Meta removida, useAutoSync irá sincronizar automaticamente');
  },
  clearGoals: () => {
    set({ goals: [] });
    // useAutoSync irá detectar a mudança e sincronizar automaticamente
  }
}));


