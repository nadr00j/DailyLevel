import { useState, useEffect, useCallback } from 'react';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { generateId } from '@/lib/uuid';
import { Task } from '@/types';
import { storage } from '@/lib/storage';
import { parseISO } from 'date-fns';

export const useTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const storedTasks = await storage.getTasks();
      setTasks(storedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveTasks = useCallback(async (newTasks: Task[]) => {
    try {
      await storage.saveTasks(newTasks);
      setTasks(newTasks);
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  }, []);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      order: tasks.length
    };
    
    const updatedTasks = [...tasks, newTask];
    await saveTasks(updatedTasks);
    return newTask;
  }, [tasks, saveTasks]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const updatedTasks = tasks.map(task =>
      task.id === id
        ? { ...task, ...updates, updatedAt: new Date().toISOString() }
        : task
    );
    await saveTasks(updatedTasks);
  }, [tasks, saveTasks]);

  const deleteTask = useCallback(async (id: string) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    await saveTasks(updatedTasks);
  }, [tasks, saveTasks]);

  const toggleTask = useCallback(async (id: string) => {
    const addXp = useGamificationStore.getState().addXp;
    const updatedTasks = tasks.map(task =>
      task.id === id
        ? { 
            ...task, 
            completed: !task.completed,
            updatedAt: new Date().toISOString()
          }
        : task
    );
    await saveTasks(updatedTasks);

    const toggled = updatedTasks.find(t=>t.id===id);
    if (toggled && toggled.completed) {
      // Criar tags baseadas na categoria da tarefa
      const tags = toggled.category ? [toggled.category.toLowerCase()] : [];
      addXp('task', tags);
    }
  }, [tasks, saveTasks]);

  const moveTask = useCallback(async (id: string, newBucket: Task['bucket']) => {
    const current = tasks.find(t=>t.id===id);
    if(!current) return;

    let updates: Partial<Task> = { bucket: newBucket };
    if (newBucket === 'week' && !current.weekStart) {
      const monday = parseISO(current.weekEnd!);
      const friday = parseISO(current.weekStart!);
      updates.weekStart = friday.toISOString().split('T')[0];
      updates.weekEnd = monday.toISOString().split('T')[0];
    }
    await updateTask(id, updates);
  }, [updateTask, tasks]);

  const reorderTasks = useCallback(async (reorderedTasks: Task[]) => {
    const tasksWithNewOrder = reorderedTasks.map((task, index) => ({
      ...task,
      order: index,
      updatedAt: new Date().toISOString()
    }));
    await saveTasks(tasksWithNewOrder);
  }, [saveTasks]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

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

  return {
    tasks,
    todayTasks,
    weekTasks,
    laterTasks,
    completedTasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    moveTask,
    reorderTasks,
    refresh: loadTasks
  };
};