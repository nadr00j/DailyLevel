import localforage from 'localforage';
import { Task, Habit, Goal, AppMeta, STORAGE_KEYS } from '@/types';

// Configure localforage for IndexedDB
localforage.config({
  driver: localforage.INDEXEDDB,
  name: 'DailyLevel',
  version: 1.0,
  storeName: 'dailylevel_data',
  description: 'DailyLevel offline storage'
});

// Storage interface
class DataStorage {
  // Tasks
  async getTasks(): Promise<Task[]> {
    return (await localforage.getItem(STORAGE_KEYS.TASKS)) || [];
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    await localforage.setItem(STORAGE_KEYS.TASKS, tasks);
  }

  // Habits
  async getHabits(): Promise<Habit[]> {
    return (await localforage.getItem(STORAGE_KEYS.HABITS)) || [];
  }

  async saveHabits(habits: Habit[]): Promise<void> {
    await localforage.setItem(STORAGE_KEYS.HABITS, habits);
  }

  // Goals
  async getGoals(): Promise<Goal[]> {
    return (await localforage.getItem(STORAGE_KEYS.GOALS)) || [];
  }

  async saveGoals(goals: Goal[]): Promise<void> {
    await localforage.setItem(STORAGE_KEYS.GOALS, goals);
  }

  // Meta
  async getMeta(): Promise<AppMeta> {
    const defaultMeta: AppMeta = {
      version: '1.0.0',
      installDate: new Date().toISOString(),
      totalHabitsCompleted: 0,
      totalTasksCompleted: 0,
      totalGoalsCompleted: 0
    };
    return (await localforage.getItem(STORAGE_KEYS.META)) || defaultMeta;
  }

  async saveMeta(meta: AppMeta): Promise<void> {
    await localforage.setItem(STORAGE_KEYS.META, meta);
  }

  // Export/Import functionality
  async exportData(): Promise<string> {
    const data = {
      tasks: await this.getTasks(),
      habits: await this.getHabits(),
      goals: await this.getGoals(),
      meta: await this.getMeta(),
      exportedAt: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  async importData(jsonData: string, merge: boolean = true): Promise<void> {
    try {
      const data = JSON.parse(jsonData);
      
      if (merge) {
        // Merge data by ID, preferring newer timestamps
        const existingTasks = await this.getTasks();
        const existingHabits = await this.getHabits();
        const existingGoals = await this.getGoals();

        const mergedTasks = this.mergeById(existingTasks, data.tasks || []);
        const mergedHabits = this.mergeById(existingHabits, data.habits || []);
        const mergedGoals = this.mergeById(existingGoals, data.goals || []);

        await this.saveTasks(mergedTasks);
        await this.saveHabits(mergedHabits);
        await this.saveGoals(mergedGoals);
      } else {
        // Replace all data
        await this.saveTasks(data.tasks || []);
        await this.saveHabits(data.habits || []);
        await this.saveGoals(data.goals || []);
      }

      // Update meta
      const currentMeta = await this.getMeta();
      await this.saveMeta({
        ...currentMeta,
        lastBackup: new Date().toISOString()
      });
    } catch (error) {
      throw new Error('Invalid backup file format');
    }
  }

  private mergeById<T extends { id: string; updatedAt: string }>(
    existing: T[],
    incoming: T[]
  ): T[] {
    const merged = new Map<string, T>();
    
    // Add existing items
    existing.forEach(item => merged.set(item.id, item));
    
    // Merge incoming items, preferring newer timestamps
    incoming.forEach(item => {
      const existingItem = merged.get(item.id);
      if (!existingItem || new Date(item.updatedAt) > new Date(existingItem.updatedAt)) {
        merged.set(item.id, item);
      }
    });
    
    return Array.from(merged.values());
  }

  // Clear all data
  async clearAll(): Promise<void> {
    await localforage.clear();
  }
}

export const storage = new DataStorage();