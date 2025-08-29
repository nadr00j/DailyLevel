export type TargetInterval = 'none' | 'daily' | 'weekly' | 'monthly';

export interface HabitLog {
  date: string;        // formato 'YYYY-MM-DD'
  count: number;       // número de conclusões neste dia
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  color: string;        // hexadecimal
  iconType: 'icon' | 'emoji';
  iconValue: string;    // nome do ícone lucide OU caractere emoji
  categories: string[];
  targetInterval: TargetInterval;
  targetCount: number;  // conclusões necessárias por intervalo (default 1)
  createdAt: string;    // ISO
  archivedAt?: string;
  activeDays?: number[]; // 0 (domingo) - 6 (sábado) dias ativos para metas semanais
  order?: number;
}
