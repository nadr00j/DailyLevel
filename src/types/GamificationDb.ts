export interface GamificationDb {
  id: string;
  user_id: string;
  xp: number;
  coins: number;
  xp30d: number;
  vitality: number;
  mood: string;
  xp_multiplier: number;
  xp_multiplier_expiry: number;
  str: number;
  int: number;
  cre: number;
  soc: number;
  aspect: string;
  rank_idx: number;
  rank_tier: string;
  rank_div: number;
  created_at: string;
  updated_at: string;
}
