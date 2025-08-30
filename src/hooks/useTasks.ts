import { useState, useEffect, useCallback } from 'react';
import { useTaskStore } from '@/stores/useTaskStore';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { generateId } from '@/lib/uuid';
import type { Task } from '@/types';
import { parseISO } from 'date-fns';

export const useTasks = () => {
  const tasks = useTaskStore(state => state.tasks);
  const addTask = useTaskStore(state => state.addTask);
  const updateTask = useTaskStore(state => state.updateTask);
  const deleteTask = useTaskStore(state => state.removeTask);
  const setTasks = useTaskStore(state => state.setTasks);
  const loading = false;

  const loadTasks = useCallback(() => {
    // no-op; tasks are loaded via DataSyncService
  }, []);

  const saveTasks = useCallback(async (newTasks: Task[]) => {
    try {
      await useTaskStore.getState().setTasks(newTasks);
      setTasks(newTasks);
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  }, []);

  const createTask = useCallback((taskData: Omit<Task,'id'|'createdAt'|'updatedAt'|'order'>) => {
    const now = new Date().toISOString();
    const newTask: Task = { ...taskData, id: generateId(), createdAt: now, updatedAt: now, order: tasks.length };
    addTask(newTask);
    return newTask;
  }, [addTask, tasks.length]);

  const editTask = useCallback((task: Task) => updateTask(task), [updateTask]);

  const removeTask = deleteTask;

  const toggleTaskStatus = useCallback((id: string) => {
    const task = tasks.find(t=>t.id===id);
    if (task) updateTask({ ...task, completed: !task.completed, updatedAt: new Date().toISOString() });
    if (task && !task.completed) useGamificationStore.getState().addXp('task', task.category?[task.category.toLowerCase()]:[]);
  }, [tasks, updateTask]);

  const moveTask = useCallback((id: string, newBucket: Task['bucket']) => {
    const task = tasks.find(t=>t.id===id);
    if(task) updateTask({ ...task, bucket: newBucket, updatedAt: new Date().toISOString() });
  }, [tasks, updateTask]);

  const reorderTasksStore = useCallback(async (reorderedTasks: Task[]) => {
    const tasksWithNewOrder = reorderedTasks.map((task, index) => ({
      ...task,
      order: index,
      updatedAt: new Date().toISOString()
    }));
    await saveTasks(tasksWithNewOrder);
  }, [saveTasks]);

  useEffect(() => {
    // No-op; tasks are hydrated by DataSyncService
  }, []);

  // Computed values
  const todayDate = new Date();

  const todayStr = todayDate.toISOString().split('T')[0]; // yyyy-MM-dd no timezone issues

  const isTodayInTaskWeek = (t: Task) => {
    if(!t.weekStart && !t.weekEnd) return false;
    const startStr = t.weekStart ?? t.weekEnd!;
    const endStr = t.weekEnd ?? t.weekStart!;
    return todayStr >= startStr && todayStr <= endStr;
  };

  const todayTasks = tasks.filter(task =>
    task.bucket === 'today' || (task.bucket==='week' && isTodayInTaskWeek(task))
  ).sort((a,b)=>a.order-b.order);

  // update overdue flag lazily
  const weekList = tasks.filter(task=>task.bucket==='week');
  weekList.forEach(t=>{
    if(t.completed) return;
    const limitStr = t.weekEnd || t.weekStart;
    if(!limitStr) return;
    const isPast = todayStr > limitStr;
    if(isPast !== !!t.overdue){
      t.overdue = isPast;
    }
  });

  const weekTasks = weekList.filter(t=>!isTodayInTaskWeek(t)).sort((a,b)=>a.order-b.order);
  const laterTasks = tasks.filter(task => task.bucket === 'later').sort((a, b) => a.order - b.order);
  const completedTasks = tasks.filter(task => task.completed);

  // Auto-mover tasks entre buckets com base em datas limite
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    tasks.forEach(t => {
      if (t.completed) return;
      // De today para week se passou dueDate
      if (t.bucket === 'today' && t.dueDate) {
        const due = t.dueDate.split('T')[0];
        if (due < today) moveTask(t.id, 'week');
      }
      // Não mover semanalmente para 'later'; tarefas semanais permanecem na aba com badge de atraso
    });
  }, [tasks, moveTask]);

  return {
    tasks,
    todayTasks,
    weekTasks,
    laterTasks,
    completedTasks,
    addTask: createTask,
    updateTask: editTask,
    deleteTask: removeTask,
    toggleTask: toggleTaskStatus,
    moveTask,
    reorderTasks: reorderTasksStore
  };
};