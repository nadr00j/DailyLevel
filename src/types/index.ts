// DailyLevel Core Types

export interface Task {
  id: string;
  title: string;
  description?: string;
  bucket: 'today' | 'week' | 'later';
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string; // Categoria da tarefa
  createdAt: string; // ISO date
  updatedAt: string;
  dueDate?: string; // ISO date
  order: number;
  // Semana (opcional)
  weekStart?: string; // ISO date (segunda)
  weekEnd?: string;   // ISO date (sexta)
  overdue?: boolean;
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  color: string;
  frequency: 'daily' | 'weekly';
  targetDays?: number[]; // 0-6 for days of week
  streak: number;
  longestStreak: number;
  completedDates: string[]; // ISO dates in local timezone
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  // Visual
  color?: string; // hex
  iconType?: 'icon' | 'emoji';
  iconValue?: string; // nome do ícone Lucide ou emoji
  targetValue: number;
  currentValue: number;
  unit: string; // e.g., 'kg', 'hours', 'books'
  category: 'health' | 'career' | 'finance' | 'learning' | 'personal';
  deadline?: string; // ISO date
  milestones: Milestone[];
  order?: number;
  createdAt: string;
  updatedAt: string;
  isCompleted: boolean;
  isFuture?: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  value: number;
  completed: boolean;
  completedAt?: string;
}

export interface AppMeta {
  version: string;
  lastBackup?: string;
  installDate: string;
  totalHabitsCompleted: number;
  totalTasksCompleted: number;
  totalGoalsCompleted: number;
}

// Utility types
export type TabView = 'today' | 'habits' | 'tasks' | 'goals';
export type TaskBucket = Task['bucket'];
export type HabitFrequency = Habit['frequency'];
export type GoalCategory = Goal['category'];

// Storage keys
export const STORAGE_KEYS = {
  TASKS: 'tasks:v1',
  HABITS: 'habits:v1',
  GOALS: 'goals:v1',
  META: 'meta:v1'
} as const;

// Date utilities
export const formatLocalDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const parseLocalDate = (dateString: string): Date => {
  return new Date(dateString + 'T00:00:00');
};

export const isToday = (dateString: string): boolean => {
  const today = formatLocalDate(new Date());
  return dateString === today;
};

export * from './ShopItem';
export * from './TaskDb';
export * from './GoalDb';
export * from './HabitDb';
export * from './GamificationData';
export * from './UserSettings';