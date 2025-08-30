export interface TaskDb {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  bucket: 'today' | 'week' | 'later';
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  due_date?: string;
  week_start?: string;
  week_end?: string;
  overdue?: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}
