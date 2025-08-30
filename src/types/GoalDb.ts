export interface GoalDb {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  color?: string;
  icon_type?: 'icon' | 'emoji';
  icon_value?: string;
  target_value: number;
  current_value: number;
  unit: string;
  category: string;
  deadline?: string;
  is_completed: boolean;
  is_future?: boolean;
  order_index?: number;
  created_at: string;
  updated_at: string;
  // Relação de marcos
  milestones?: {
    id: string;
    title: string;
    value: number;
    completed: boolean;
    completed_at?: string;
  }[];
}
