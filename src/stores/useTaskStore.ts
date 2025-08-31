import { create } from 'zustand';
import { useAuthStore } from '@/stores/useAuthStore';
import { dataSyncService } from '@/lib/DataSyncService';
import type { Task } from '@/types';

interface TaskState {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  clearTasks: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  setTasks: (tasks) => {
    set({ tasks });
  },
  addTask: (task) => {
    const tasks = [...get().tasks, task];
    set({ tasks });
    // Forçar sincronização imediata
    const userId = useAuthStore.getState().user!.id;
    if (userId) {
      console.log('🔍 [DEBUG] useTaskStore.addTask - Forçando sync imediato para tarefa:', task.title);
      dataSyncService.syncAll(userId);
    }
  },
  updateTask: (task) => {
    const tasks = get().tasks.map(t => t.id === task.id ? task : t);
    set({ tasks });
    // useAutoSync irá detectar a mudança e sincronizar automaticamente
  },
  removeTask: (taskId) => {
    const tasks = get().tasks.filter(t => t.id !== taskId);
    set({ tasks });
    // useAutoSync irá detectar a mudança e sincronizar automaticamente
  },
  clearTasks: () => {
    set({ tasks: [] });
    // useAutoSync irá detectar a mudança e sincronizar automaticamente
  }
}));


