import { UserDataManager } from './userDataManager';
import { useAuthStore } from '@/stores/useAuthStore';

class AutoSaveManager {
  private static instance: AutoSaveManager;
  private intervalId: NodeJS.Timeout | null = null;
  private isEnabled = false;

  private constructor() {}

  static getInstance(): AutoSaveManager {
    if (!AutoSaveManager.instance) {
      AutoSaveManager.instance = new AutoSaveManager();
    }
    return AutoSaveManager.instance;
  }

  start(intervalMinutes: number = 5): void {
    if (this.isEnabled) {
      this.stop();
    }

    this.isEnabled = true;
    this.intervalId = setInterval(async () => {
      try {
        const { isAuthenticated } = useAuthStore.getState();
        if (isAuthenticated) {
          await UserDataManager.saveUserDataAuto();
          console.log('[AutoSave] Dados salvos automaticamente');
        }
      } catch (error) {
        console.error('[AutoSave] Erro ao salvar dados automaticamente:', error);
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`[AutoSave] Iniciado - salvando a cada ${intervalMinutes} minutos`);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isEnabled = false;
    console.log('[AutoSave] Parado');
  }

  isRunning(): boolean {
    return this.isEnabled && this.intervalId !== null;
  }

  // Salvar imediatamente
  async saveNow(): Promise<void> {
    try {
      const { isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated) {
        await UserDataManager.saveUserDataAuto();
        console.log('[AutoSave] Salvamento manual realizado');
      }
    } catch (error) {
      console.error('[AutoSave] Erro no salvamento manual:', error);
      throw error;
    }
  }
}

export const autoSaveManager = AutoSaveManager.getInstance();
