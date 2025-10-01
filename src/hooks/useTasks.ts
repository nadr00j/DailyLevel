import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTaskStore } from '@/stores/useTaskStore';
import { useGamificationStoreV21 } from '@/stores/useGamificationStoreV21';
import { generateId } from '@/lib/uuid';
import type { Task } from '@/types';
import { parseISO } from 'date-fns';
import { db } from '@/lib/database';
import { useAuthStore } from '@/stores/useAuthStore';
import { dataSyncService } from '@/lib/DataSyncService';

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
    if (task) {
      const updatedTask = { ...task, completed: !task.completed, updatedAt: new Date().toISOString() };
      updateTask(updatedTask);
      // Persist task completion immediately
      const userId = useAuthStore.getState().user!.id;
      db.saveTask(userId, updatedTask)
        .catch(err => console.error('[useTasks] Erro ao salvar tarefa concluída:', err));
    }
    // Removido: A gamificação agora é gerenciada pelo VitalityListener
    // para evitar chamadas duplicadas de addXp
  }, [tasks, updateTask]);

  // Função para remover tarefas concluídas em dias anteriores
  const cleanupOldCompletedTasks = useCallback(() => {
    // Usar timezone brasileiro (UTC-3)
    const now = new Date();
    const brazilTime = new Date(now.getTime() - (3 * 60 * 60 * 1000)); // UTC-3
    const todayBrazil = brazilTime.toISOString().split('T')[0];
    
    const tasksToCleanup = tasks.filter(task => {
      if (!task.completed || !task.updatedAt) return false;
      
      // Converter timestamp da tarefa para timezone brasileiro
      const taskTimestamp = new Date(task.updatedAt);
      const taskBrazilTime = new Date(taskTimestamp.getTime() - (3 * 60 * 60 * 1000));
      const taskDateBrazil = taskBrazilTime.toISOString().split('T')[0];
      
      const isOldCompleted = taskDateBrazil < todayBrazil;
      
      if (isOldCompleted) {
        console.log('[useTasks] Removendo tarefa antiga concluída (timezone brasileiro):', {
          id: task.id,
          title: task.title,
          completedOnUTC: new Date(task.updatedAt).toLocaleString(),
          completedOnBrazil: taskBrazilTime.toLocaleString('pt-BR'),
          taskDateBrazil,
          todayBrazil
        });
      }
      
      return isOldCompleted;
    });
    
    if (tasksToCleanup.length > 0) {
      console.log(`[useTasks] Removendo ${tasksToCleanup.length} tarefas antigas concluídas`);
      
      // Remover tarefas antigas
      tasksToCleanup.forEach(task => {
        deleteTask(task.id);
      });
      
      // Sincronizar com Supabase
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        dataSyncService.syncAll(userId).catch(err => 
          console.error('[useTasks] Erro ao sincronizar após limpeza:', err)
        );
      }
    }
  }, [tasks, deleteTask]);

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

  // Executar limpeza automática ao carregar e a cada mudança nas tarefas
  useEffect(() => {
    // Delay para garantir que as tarefas foram carregadas
    const timer = setTimeout(() => {
      cleanupOldCompletedTasks();
    }, 2000); // 2 segundos após carregar

    return () => clearTimeout(timer);
  }, []); // Executar apenas uma vez ao montar

  // REMOVIDO: useEffect que causava loop infinito
  // Este useEffect estava causando loops de sincronização constantes
  // A limpeza automática já é feita no useEffect acima (linha 125-132)

  // Computed values
  const todayDate = new Date();

  const todayStr = todayDate.toISOString().split('T')[0]; // yyyy-MM-dd no timezone issues

  const isTodayInTaskWeek = (t: Task) => {
    if(!t.weekStart && !t.weekEnd) return false;
    const startStr = t.weekStart ?? t.weekEnd!;
    const endStr = t.weekEnd ?? t.weekStart!;
    return todayStr >= startStr && todayStr <= endStr;
  };

  // Memoizar arrays de tarefas para evitar recriação constante
  const todayTasks = useMemo(() => tasks.filter(task =>
    task.bucket === 'today' || (task.bucket==='week' && isTodayInTaskWeek(task))
  ).sort((a,b)=>a.order-b.order), [tasks, todayStr]);

  // update overdue flag lazily
  const weekList = useMemo(() => tasks.filter(task=>task.bucket==='week'), [tasks]);
  weekList.forEach(t=>{
    if(t.completed) return;
    const limitStr = t.weekEnd || t.weekStart;
    if(!limitStr) return;
    const isPast = todayStr > limitStr;
    if(isPast !== !!t.overdue){
      t.overdue = isPast;
    }
  });

  const weekTasks = useMemo(() => weekList.filter(t=>!isTodayInTaskWeek(t)).sort((a,b)=>a.order-b.order), [weekList, todayStr]);
  const laterTasks = useMemo(() => tasks.filter(task => task.bucket === 'later').sort((a, b) => a.order - b.order), [tasks]);
  const completedTasks = useMemo(() => tasks.filter(task => task.completed), [tasks]);

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
    reorderTasks: reorderTasksStore,
    cleanupOldCompletedTasks
  };
};