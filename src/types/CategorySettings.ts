export interface CategorySetting {
  id?: string;
  userId: string;
  type: 'habits' | 'goals' | 'tasks' | 'tasks-today' | 'tasks-week' | 'tasks-later';
  categoryName: string;
  categoryOrder: number;
  isCollapsed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategorySettingsDb {
  id: string;
  user_id: string;
  type: 'habits' | 'goals' | 'tasks' | 'tasks-today' | 'tasks-week' | 'tasks-later';
  category_name: string;
  category_order: number;
  is_collapsed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategorySettingsGroup {
  [categoryName: string]: {
    order: number;
    isCollapsed: boolean;
  };
}
