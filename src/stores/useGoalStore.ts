import { create } from 'zustand';
import { useAuthStore } from '@/stores/useAuthStore';
import { dataSyncService } from '@/lib/DataSyncService';
import { db } from '@/lib/database';
import { generateId } from '@/lib/uuid';
import type { Goal } from '@/types';
import { useGamificationStoreV21 } from '@/stores/useGamificationStoreV21';

// Function to get current date in Brazil timezone (UTC-3)
const getBrazilToday = (): string => {
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

// Function to format Date object to YYYY-MM-DD in Brazil timezone
const formatDateBrazil = (date: Date): string => {
  // Convert to Brazil timezone (UTC-3)
  const brazilOffset = -3 * 60; // -3 hours in minutes
  const utc = date.getTime() + (date.getTimezoneOffset() * 60000);
  const brazilTime = new Date(utc + (brazilOffset * 60000));
  
  // Format as YYYY-MM-DD
  const year = brazilTime.getFullYear();
  const month = String(brazilTime.getMonth() + 1).padStart(2, '0');
  const day = String(brazilTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

interface GoalState {
  goals: Goal[];
  goalCategoryOrder: string[];
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (goal: Goal) => void;
  removeGoal: (goalId: string) => Promise<void>;
  clearGoals: () => void;
  setGoalCategoryOrder: (order: string[]) => void;
  reorderGoals: (ordered: Goal[]) => void;
  updateGoalProgress: (id: string, newValue: number) => void;
}

export const useGoalStore = create<GoalState>((set, get) => {
  // Initialize category order from localStorage (only for UI preferences)
  const initialCatOrder = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('dl.goalCategoryOrder') || '[]')
    : [];
  return {
    goals: [],
    goalCategoryOrder: initialCatOrder,
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
        createdAt: goal.createdAt || getBrazilToday(), // Use Brazil timezone
        updatedAt: goal.updatedAt || getBrazilToday(), // Use Brazil timezone
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
        updatedAt: getBrazilToday() // Use Brazil timezone
      };
      
      const goalsArr = get().goals.map(g => g.id === goal.id ? goalWithTimestamp : g); 
      set({ goals: goalsArr });
      console.log('✅ [DEBUG] useGoalStore.updateGoal - Meta atualizada no store:', goal.title, goal.id);
      console.log('🔍 [DEBUG] useGoalStore.updateGoal - Meta atualizada, useAutoSync irá sincronizar automaticamente');
    },
    removeGoal: async (goalId) => {
      // Remove from local store
      set(state => ({ goals: state.goals.filter(g => g.id !== goalId) }));
      console.log('✅ [DEBUG] useGoalStore.removeGoal - Meta removida do store:', goalId);
      
      // Remove from Supabase directly
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        try {
          await db.deleteGoal(userId, goalId);
          console.log('✅ [DEBUG] useGoalStore.removeGoal - Meta removida do Supabase:', goalId);
        } catch (error) {
          console.error('❌ [DEBUG] useGoalStore.removeGoal - Erro ao remover meta do Supabase:', error);
        }
      }
    },
    clearGoals: () => {
      set({ goals: [] });
      // useAutoSync irá detectar a mudança e sincronizar automaticamente
    },
    setGoalCategoryOrder: (order) => {
      set({ goalCategoryOrder: order });
      try { localStorage.setItem('dl.goalCategoryOrder', JSON.stringify(order)); } catch {};
    },
    reorderGoals: (ordered: Goal[]) => {
      // Only update order field on matched goals
      set(state => ({
        goals: state.goals.map(g => {
          const idx = ordered.findIndex(o => o.id === g.id);
          return idx > -1 ? { ...g, order: idx } : g;
        }),
      }));
      console.log('🔍 [DEBUG] useGoalStore.reorderGoals - Ordem atualizada, sincronizando...');
    },
    updateGoalProgress: (id: string, newValue: number) => {
      const goal = get().goals.find(g => g.id === id);
      if (!goal) return;
      const isCompleted = newValue >= goal.targetValue;
      set(state => ({
        goals: state.goals.map(g =>
          g.id === id ? { ...g, currentValue: newValue, isCompleted, updatedAt: getBrazilToday() } : g // Use Brazil timezone
        )
      }));
      if (!goal.isCompleted && isCompleted) {
        const us = useGamificationStoreV21.getState();
        const goalXp = us.config.points.goal;
        const goalCoins = Math.floor(goalXp * 0.1); // 10% do XP
        
        console.log('[GoalStore] Meta completada! Registrando histórico com:', { 
          xp: goalXp, 
          coins: goalCoins, 
          title: goal.title, 
          category: goal.category 
        });
        
        // Removido: A gamificação agora é gerenciada pelo VitalityListener
        
        // Registra no histórico
        const userId = useAuthStore.getState().user!.id;
        db.addHistoryItem(userId, {
          ts: Date.now(),
          type: 'goal',
          xp: goalXp,
          coins: goalCoins,
          category: goal.category,
          tags: [goal.title],
        }).catch(err => console.error('[GoalStore] Erro ao registrar histórico de meta:', err));
      }
    }
  };
});


