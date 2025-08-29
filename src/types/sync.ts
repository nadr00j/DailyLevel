export interface SyncState {
  isOnline: boolean;
  lastSync: number;
  pendingChanges: Change[];
  userId?: string;
}

export interface Change {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'task' | 'habit' | 'goal' | 'gamification' | 'shop';
  data: any;
  timestamp: number;
}

export interface UserData {
  userId: string;
  gamification: any;
  tasks: any[];
  habits: any[];
  goals: any[];
  shop: any;
  lastSync: number;
  version: string;
}

export interface SyncConfig {
  autoSync: boolean;
  syncInterval: number; // em minutos
  enableOfflineMode: boolean;
}
