export interface ShopItem {
  id?: string;
  userId?: string;
  name: string;
  description?: string;
  price: number;
  category: 'cosmetic' | 'vantagens' | 'special' | 'boost' | 'utility';
  icon?: string;
  purchased: boolean;
  pixelBuddyData?: {
    type: 'clothes' | 'accessory' | 'hat' | 'effect';
    spritePath: string;
    rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  };
}
