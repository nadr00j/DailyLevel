import { useState, useEffect, useCallback } from 'react';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { Goal, Milestone } from '@/types';
import { storage } from '@/lib/storage';
import { generateId } from '@/lib/uuid';

export const useGoals = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGoals = useCallback(async () => {
    try {
      setLoading(true);
      const storedGoals = await storage.getGoals();
      setGoals(storedGoals);
    } catch (error) {
      console.error('Failed to load goals:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveGoals = useCallback(async (newGoals: Goal[]) => {
    try {
      await storage.saveGoals(newGoals);
      setGoals(newGoals);
    } catch (error) {
      console.error('Failed to save goals:', error);
    }
  }, []);

  const addGoal = useCallback(async (goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'currentValue' | 'isCompleted' | 'milestones'>) => {
    const now = new Date().toISOString();
    const newGoal: Goal = {
      ...goalData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      currentValue: 0,
      isCompleted: false,
      milestones: [],
      order: goals.length
    };
    
    const updatedGoals = [...goals, newGoal];
    await saveGoals(updatedGoals);
    return newGoal;
  }, [goals, saveGoals]);

  const updateGoal = useCallback(async (id: string, updates: Partial<Goal>) => {
    const updatedGoals = goals.map(goal =>
      goal.id === id
        ? { ...goal, ...updates, updatedAt: new Date().toISOString() }
        : goal
    );
    await saveGoals(updatedGoals);
  }, [goals, saveGoals]);

  const deleteGoal = useCallback(async (id: string) => {
    const updatedGoals = goals.filter(goal => goal.id !== id);
    await saveGoals(updatedGoals);
  }, [goals, saveGoals]);

  const updateGoalProgress = useCallback(async (id: string, newValue: number) => {
    const addXp = useGamificationStore.getState().addXp;
    const goal = goals.find(g => g.id === id);
    if (!goal) return;

    const isCompleted = newValue >= goal.targetValue;
    
    // Update milestone completion
    const updatedMilestones = goal.milestones.map(milestone => {
      const nowCompleted = newValue >= milestone.value;
      // se acabou de completar ➜ XP milestone
      if(!milestone.completed && nowCompleted){
        addXp('milestone', []);
      }
      return {
        ...milestone,
        completed: nowCompleted,
        completedAt: nowCompleted && !milestone.completed ? new Date().toISOString() : milestone.completedAt
      }
    });

    await updateGoal(id, {
      currentValue: newValue,
      isCompleted,
      milestones: updatedMilestones
    });

    // Se a meta foi concluída agora
    if(!goal.isCompleted && isCompleted){
      console.log('[Goals Debug] Goal completed, calling addXp for goal:', goal.title);
      addXp('goal', []);
    }
  }, [goals, updateGoal]);

  const addMilestone = useCallback(async (goalId: string, milestone: Omit<Milestone, 'id' | 'completed' | 'completedAt'>) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newMilestone: Milestone = {
      ...milestone,
      id: generateId(),
      completed: goal.currentValue >= milestone.value,
      completedAt: goal.currentValue >= milestone.value ? new Date().toISOString() : undefined
    };

    const updatedMilestones = [...goal.milestones, newMilestone].sort((a, b) => a.value - b.value);
    await updateGoal(goalId, { milestones: updatedMilestones });
  }, [goals, updateGoal]);

  const removeMilestone = useCallback(async (goalId: string, milestoneId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const updatedMilestones = goal.milestones.filter(m => m.id !== milestoneId);
    await updateGoal(goalId, { milestones: updatedMilestones });
  }, [goals, updateGoal]);

  const reorderGoals = useCallback((bucketOrdered: Goal[]) => {
    if (!bucketOrdered.length) return;

    // map id -> goal with updated order
    const map = new Map<string, Goal>();
    bucketOrdered.forEach((g, idx) => map.set(g.id, { ...g, order: idx }));

    const next = goals.map((g) => map.get(g.id) ?? g);
    setGoals(next); // optimistic
    storage.saveGoals(next);
  }, [goals]);

  const getGoalProgress = useCallback((goal: Goal): number => {
    if (goal.targetValue === 0) return 0;
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  }, []);

  const getNextMilestone = useCallback((goal: Goal): Milestone | null => {
    const incompleteMilestones = goal.milestones
      .filter(m => !m.completed)
      .sort((a, b) => a.value - b.value);
    
    return incompleteMilestones[0] || null;
  }, []);

  const getCompletedMilestones = useCallback((goal: Goal): Milestone[] => {
    return goal.milestones.filter(m => m.completed);
  }, []);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  // Computed values
  const byOrder = (a:Goal,b:Goal)=>(a.order ?? 0)-(b.order ?? 0);
  const futureGoals = goals.filter(g=>!g.isCompleted && g.isFuture).sort(byOrder);
  const activeList = goals.filter(g=>!g.isCompleted && !g.isFuture).sort(byOrder);

  const activeGoals = activeList;
  const completedGoals = goals.filter(goal => goal.isCompleted);
  const urgentGoals = activeGoals.filter(goal => {
    if (!goal.deadline) return false;
    const deadline = new Date(goal.deadline);
    const now = new Date();
    const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDeadline <= 7 && daysUntilDeadline >= 0;
  });

  return {
    goals,
    activeGoals,
    completedGoals,
    futureGoals,
    loading,
    addGoal,
    updateGoal,
    deleteGoal,
    updateGoalProgress,
    addMilestone,
    removeMilestone,
    getGoalProgress,
    getNextMilestone,
    getCompletedMilestones,
    reorderGoals,
    refresh: loadGoals
  };
};