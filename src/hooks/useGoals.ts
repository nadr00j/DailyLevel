import { useMemo } from 'react';
import { useGoalStore } from '@/stores/useGoalStore';
import { useGamificationStoreV21 } from '@/stores/useGamificationStoreV21';
import { Goal, Milestone } from '@/types';

export const useGoals = () => {
  const goals = useGoalStore(state => state.goals);
  const addGoal = useGoalStore(state => state.addGoal);
  const updateGoal = useGoalStore(state => state.updateGoal);
  const deleteGoal = useGoalStore(state => state.removeGoal);
  const setGoals = useGoalStore(state => state.setGoals);
  // REMOVIDO: addXp agora é chamado apenas pelo VitalityListener
  // const addXp = useGamificationStoreV21.getState().addXp;

  // Computed lists - memoizadas para evitar recriação constante
  const byOrder = (a: Goal, b: Goal) => (a.order ?? 0) - (b.order ?? 0);
  const futureGoals = useMemo(() => goals.filter(g => !g.isCompleted && g.isFuture).sort(byOrder), [goals]);
  const activeGoals = useMemo(() => goals.filter(g => !g.isCompleted && !g.isFuture).sort(byOrder), [goals]);
  const completedGoals = useMemo(() => goals.filter(g => g.isCompleted).sort(byOrder), [goals]);

  // Update goal progress and grant XP on completion
  const updateGoalProgress = (id: string, newValue: number) => {
    // Usar a função do store que tem a lógica completa de gamificação
    useGoalStore.getState().updateGoalProgress(id, newValue);
  };

  // Reorder goals and persist via store action
  const reorderGoals = (newOrder: Goal[]) => {
    const storeReorder = useGoalStore.getState().reorderGoals;
    storeReorder(newOrder);
  };

  // Helper to compute progress percentage
  const getGoalProgress = (goal: Goal): number => {
    const val = goal.currentValue ?? 0;
    return goal.targetValue ? Math.min((val / goal.targetValue) * 100, 100) : 0;
  };
  // Get next incomplete milestone
  const getNextMilestone = (goal: Goal): Milestone | null => {
    const incomplete = (goal.milestones || []).filter(m => !m.completed).sort((a, b) => a.value - b.value);
    return incomplete[0] || null;
  };

  return {
    goals,
    activeGoals,
    completedGoals,
    futureGoals,
    addGoal,
    updateGoal,
    deleteGoal,
    updateGoalProgress,
    reorderGoals,
    getGoalProgress,
    getNextMilestone
  };
};