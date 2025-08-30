export interface HabitDb {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  color?: string;
  icon_type?: string;
  icon_value?: string;
  categories?: string[];
  frequency: 'daily' | 'weekly';
  target_days?: number[];
  target_count?: number;
  order_index?: number;
  streak: number;
  longest_streak: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  archived_at?: string;
  // relation
  habit_completions?: { completion_date: string }[];
}
