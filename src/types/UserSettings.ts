export interface UserSettings {
  id?: string;
  userId: string;
  confettiEnabled: boolean;
  gamificationConfig: Record<string, any>;
}
