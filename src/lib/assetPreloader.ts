// Sistema de pré-carregamento de assets do PixelBuddy
export class AssetPreloader {
  private static loadedAssets = new Set<string>();
  private static loadingPromises = new Map<string, Promise<void>>();

  // Lista de todos os sprites disponíveis
  private static readonly spritePaths = [
    // Bodies
    '/Nadr00J/bodies/body_lvl1.png',
    '/Nadr00J/bodies/body_lvl2.png',
    '/Nadr00J/bodies/body_lvl3.png',
    
    // Heads
    '/Nadr00J/heads/head_neutral.png',
    '/Nadr00J/heads/head_happy.png',
    '/Nadr00J/heads/head_tired.png',
    '/Nadr00J/heads/head_sad.png',
    '/Nadr00J/heads/head_confident.png',
    '/Nadr00J/heads/head_evolved.png',
    
    // Clothes
    '/Nadr00J/clothes/clothes_tshirt.png',
    '/Nadr00J/clothes/clothes_hoodie.png',
    '/Nadr00J/clothes/clothes_jacket.png',
    '/Nadr00J/clothes/clothes_regata.png',
    '/Nadr00J/clothes/clothes_suit.png',
    
    // Hats
    '/Nadr00J/hats/hat_cap.png',
    '/Nadr00J/hats/hat_beanie.png',
    '/Nadr00J/hats/hat_cowboy.png',
    '/Nadr00J/hats/hat_top_hat.png',
    
    // Accessories
    '/Nadr00J/acessories/accessory_glasses.png',
    '/Nadr00J/acessories/accessory_mask.png',
    
    // Effects
    '/Nadr00J/effects/effect_confetti.png',
    '/Nadr00J/effects/effect_aura_green.png',
    '/Nadr00J/effects/effect_aura_blue.png',
    '/Nadr00J/effects/effect_aura_red.png',
    '/Nadr00J/effects/effect_frozen.png'
  ];

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

  // Pré-carregar todos os sprites
  static async preloadAllSprites(): Promise<void> {
    console.log('[AssetPreloader] Starting preload of all sprites...');
    
    const promises = this.spritePaths.map(path => this.preloadSprite(path));
    
    try {
      await Promise.allSettled(promises);
      console.log('[AssetPreloader] All sprites preloaded successfully');
    } catch (error) {
      console.error('[AssetPreloader] Some sprites failed to load:', error);
    }
  }

  // Pré-carregar sprites essenciais (bodies e heads)
  static async preloadEssentialSprites(): Promise<void> {
    const essentialPaths = [
      '/Nadr00J/bodies/body_lvl1.png',
      '/Nadr00J/bodies/body_lvl2.png',
      '/Nadr00J/bodies/body_lvl3.png',
      '/Nadr00J/heads/head_neutral.png',
      '/Nadr00J/heads/head_happy.png',
      '/Nadr00J/heads/head_tired.png',
      '/Nadr00J/heads/head_sad.png',
      '/Nadr00J/heads/head_confident.png'
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

  // Obter progresso do carregamento
  static getLoadingProgress(): number {
    const total = this.spritePaths.length;
    const loaded = this.loadedAssets.size;
    return total > 0 ? (loaded / total) * 100 : 0;
  }

  // Limpar cache (útil para desenvolvimento)
  static clearCache(): void {
    this.loadedAssets.clear();
    this.loadingPromises.clear();
    console.log('[AssetPreloader] Cache cleared');
  }
}
