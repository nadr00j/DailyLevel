import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { storage } from '@/lib/storage';
import type { Task } from '@/types';

interface TaskState {
  tasks: Task[];
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (task: Task) => void;
  removeTask: (taskId: string) => void;
  clearTasks: () => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],
      setTasks: (tasks) => {
        set({ tasks });
        storage.saveTasks(tasks);
      },
      addTask: (task) => {
        const tasks = [...get().tasks, task];
        set({ tasks });
        storage.saveTasks(tasks);
      },
      updateTask: (task) => {
        const tasks = get().tasks.map(t => t.id === task.id ? task : t);
        set({ tasks });
        storage.saveTasks(tasks);
      },
      removeTask: (taskId) => {
        const tasks = get().tasks.filter(t => t.id !== taskId);
        set({ tasks });
        storage.saveTasks(tasks);
      },
      clearTasks: () => {
        set({ tasks: [] });
        storage.saveTasks([]);
      }
    }),
    {
      name: 'dl.tasks.v1',
      storage: createJSONStorage(() => localforage),
    }
  )
);


