export interface UserSettingsDb {
  id: string;
  user_id: string;
  confetti_enabled: boolean;
  gamification_config: Record<string, any>;
  created_at: string;
  updated_at: string;
}
