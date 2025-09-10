export interface CategorySetting {
  id?: string;
  userId: string;
  type: 'habits' | 'goals';
  categoryName: string;
  categoryOrder: number;
  isCollapsed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategorySettingsDb {
  id: string;
  user_id: string;
  type: 'habits' | 'goals';
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
