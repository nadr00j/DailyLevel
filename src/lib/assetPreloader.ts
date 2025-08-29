// Sistema de pré-carregamento de assets do PixelBuddy
export class AssetPreloader {
  private static loadedAssets = new Set<string>();
  private static loadingPromises = new Map<string, Promise<void>>();

  // Função para obter sprites baseado no usuário
  private static getSpritePaths(username: string | null = null): string[] {
    const userPath = username ? `/${username}` : '/Nadr00J';
    
    return [
      // Bodies
      `${userPath}/bodies/body_lvl1.png`,
      `${userPath}/bodies/body_lvl2.png`,
      `${userPath}/bodies/body_lvl3.png`,
      
      // Heads
      `${userPath}/heads/head_neutral.png`,
      `${userPath}/heads/head_happy.png`,
      `${userPath}/heads/head_tired.png`,
      `${userPath}/heads/head_sad.png`,
      `${userPath}/heads/head_confident.png`,
      `${userPath}/heads/head_evolved.png`,
      
      // Clothes
      `${userPath}/clothes/clothes_tshirt.png`,
      `${userPath}/clothes/clothes_hoodie.png`,
      `${userPath}/clothes/clothes_jacket.png`,
      `${userPath}/clothes/clothes_regata.png`,
      `${userPath}/clothes/clothes_suit.png`,
      
      // Hats
      `${userPath}/hats/hat_cap.png`,
      `${userPath}/hats/hat_beanie.png`,
      `${userPath}/hats/hat_cowboy.png`,
      `${userPath}/hats/hat_top_hat.png`,
      
      // Accessories
      `${userPath}/acessories/accessory_glasses.png`,
      `${userPath}/acessories/accessory_mask.png`,
      
      // Effects
      `${userPath}/effects/effect_confetti.png`,
      `${userPath}/effects/effect_aura_green.png`,
      `${userPath}/effects/effect_aura_blue.png`,
      `${userPath}/effects/effect_aura_red.png`,
      `${userPath}/effects/effect_frozen.png`
    ];
  }

  // Pré-carregar um sprite específico
  static async preloadSprite(path: string): Promise<void> {
    if (this.loadedAssets.has(path)) {
      return Promise.resolve();
    }

    if (this.loadingPromises.has(path)) {
      return this.loadingPromises.get(path)!;
    }

    const loadPromise = new Promise<void>((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        this.loadedAssets.add(path);
        this.loadingPromises.delete(path);
        console.log(`[AssetPreloader] Loaded: ${path}`);
        resolve();
      };
      
      img.onerror = () => {
        this.loadingPromises.delete(path);
        console.warn(`[AssetPreloader] Failed to load: ${path}`);
        reject(new Error(`Failed to load sprite: ${path}`));
      };
      
      img.src = path;
    });

    this.loadingPromises.set(path, loadPromise);
    return loadPromise;
  }

  // Pré-carregar todos os sprites para um usuário específico
  static async preloadAllSprites(username: string | null = null): Promise<void> {
    console.log('[AssetPreloader] Starting preload of all sprites...');
    
    const spritePaths = this.getSpritePaths(username);
    const promises = spritePaths.map(path => this.preloadSprite(path));
    
    try {
      await Promise.allSettled(promises);
      console.log('[AssetPreloader] All sprites preloaded successfully');
    } catch (error) {
      console.error('[AssetPreloader] Some sprites failed to load:', error);
    }
  }

  // Pré-carregar sprites essenciais (bodies e heads) para um usuário específico
  static async preloadEssentialSprites(username: string | null = null): Promise<void> {
    const userPath = username ? `/${username}` : '/Nadr00J';
    const essentialPaths = [
      `${userPath}/bodies/body_lvl1.png`,
      `${userPath}/bodies/body_lvl2.png`,
      `${userPath}/bodies/body_lvl3.png`,
      `${userPath}/heads/head_neutral.png`,
      `${userPath}/heads/head_happy.png`,
      `${userPath}/heads/head_tired.png`,
      `${userPath}/heads/head_sad.png`,
      `${userPath}/heads/head_confident.png`
    ];

    console.log('[AssetPreloader] Starting preload of essential sprites...');
    
    const promises = essentialPaths.map(path => this.preloadSprite(path));
    
    try {
      await Promise.allSettled(promises);
      console.log('[AssetPreloader] Essential sprites preloaded successfully');
    } catch (error) {
      console.error('[AssetPreloader] Some essential sprites failed to load:', error);
    }
  }

  // Verificar se um sprite está carregado
  static isLoaded(path: string): boolean {
    return this.loadedAssets.has(path);
  }

  // Obter progresso do carregamento para um usuário específico
  static getLoadingProgress(username: string | null = null): number {
    const spritePaths = this.getSpritePaths(username);
    const total = spritePaths.length;
    const loaded = spritePaths.filter(path => this.loadedAssets.has(path)).length;
    return total > 0 ? (loaded / total) * 100 : 0;
  }

  // Limpar cache (útil para desenvolvimento)
  static clearCache(): void {
    this.loadedAssets.clear();
    this.loadingPromises.clear();
    console.log('[AssetPreloader] Cache cleared');
  }
}
