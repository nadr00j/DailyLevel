export type ActionType = 'habit' | 'task' | 'milestone' | 'goal';

export interface CategoryConfig {
  tags: string[];
  target30d: number;
  weight: number;
}

export interface PointsConfig {
  habit: number;
  task: number;
  milestone: number;
  goal: number;
  coinsPerXp: number;
  vitalityMonthlyTarget: number;
  vitalityDecayPerMissedDay: number;
}

export interface StreakBonusConfig {
  bonus7: number;
  bonus30: number;
}

export interface GamificationConfig {
  points: PointsConfig;
  categories: Record<string, CategoryConfig>;
  streaks: StreakBonusConfig;
}

export interface HistoryItem {
  ts: number;
  type: ActionType;
  xp: number;
  coins: number;
  tags?: string[];
  category?: string;
}

export type Aspect = 'bal' | 'str' | 'int' | 'cre' | 'soc';

export interface GamificationState {
  // métricas principais
  xp: number;
  coins: number;
  xp30d: number;
  vitality: number;
  mood: 'happy' | 'neutral' | 'tired' | 'sad';
  xpMultiplier: number;
  xpMultiplierExpiry: number;

  // atributos de 30 dias
  str: number;
  int: number;
  cre: number;
  soc: number;
  aspect: Aspect;

  // ranking
  rankIdx: number;          // 0..23 or 24 for God
  rankTier: string;         // "Bronze".."God"
  rankDiv: number | 0;      // 1..3, 0 for God

  // histórico e config
  history: HistoryItem[];
  config: GamificationConfig;

  // actions
  addXp: (type: ActionType, tags?: string[]) => void;
  setXpMultiplier: (multiplier: number, duration: number) => void;
  syncFromSupabase: (data: any) => void;
  syncVitalityFromSupabase: (vitalityValue: number) => void;
  setConfig: (cfg: Partial<GamificationConfig>) => void;
  init: () => void;
}
