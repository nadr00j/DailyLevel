import { useAuthStore } from '@/stores/useAuthStore';

// Hook para gerenciar assets do PixelBuddy baseado no usuário
export function usePixelBuddyAssets() {
  const { username } = useAuthStore();
  
  // Função para obter o caminho base do usuário
  const getUserAssetPath = (user: string | null): string => {
    return user ? `/${user}` : '/Nadr00J';
  };
  
  const userPath = getUserAssetPath(username);
  
  // Retornar paths dinâmicos baseados no usuário
  return {
    userPath,
    username,
    getAssetPath: (category: string, filename: string) => `${userPath}/${category}/${filename}`,
    getBodyPath: (level: number) => `${userPath}/bodies/body_lvl${level}.png`,
    getHeadPath: (expression: string) => `${userPath}/heads/head_${expression}.png`,
    getClothesPath: (item: string) => `${userPath}/clothes/${item}.png`,
    getHatPath: (item: string) => `${userPath}/hats/${item}.png`,
    getAccessoryPath: (item: string) => `${userPath}/acessories/${item}.png`,
    getEffectPath: (item: string) => `${userPath}/effects/${item}.png`,
  };
}
