import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { supabase } from '@/lib/supabase';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VitalityState {
  value: number;
  version: number;
  lastCloseDate: string;
}

export interface VitalityEvent {
  type: 'HABIT_DONE' | 'TASK_DONE' | 'GOAL_DONE' | 'XP_GAIN' | 'COIN_GAIN';
  payload?: any;
}

// Store persistente para vitalidade
interface VitalityStoreState {
  vitalityState: VitalityState;
  setVitalityState: (state: VitalityState) => void;
  updateVitality: (value: number) => void;
}

const useVitalityStore = create<VitalityStoreState>()(
  persist(
    (set) => ({
      vitalityState: {
        value: 50,
        version: 0,
        lastCloseDate: new Date().toISOString().split('T')[0]
      },
      setVitalityState: (state) => set({ vitalityState: state }),
      updateVitality: (value) => set((state) => ({
        vitalityState: {
          ...state.vitalityState,
          value,
          version: state.vitalityState.version + 1
        }
      }))
    }),
    { name: 'dl.vitality.v21' }
  )
);

export const useVitalityV21 = () => {
  const { vitalityState, setVitalityState, updateVitality } = useVitalityStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const user = useAuthStore(state => state.user);

  // Sincronizar vitalidade na abertura do app
  const syncOnOpen = useCallback(async () => {
    if (!user?.id) return;

    // Evitar múltiplas sincronizações simultâneas
    if (isSyncing) {
      return;
    }

    setIsSyncing(true);
    setIsLoading(true);
    setError(null);

    try {
      // Log removido para reduzir spam
      
      // Chamar RPC para sincronizar na abertura (fecha dias pendentes)
      const { data, error } = await supabase.rpc('vitality_sync_open', {
        p_user: user.id
      });

      if (error) {
        console.error('[Vitality V2.1] Erro ao sincronizar:', error);
        setError('Erro ao sincronizar vitalidade');
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        // Log removido para reduzir spam
        
        const newVitalityValue = Number(result.value) || 50;
        
        setVitalityState({
          value: newVitalityValue,
          version: Number(result.version) || 0,
          lastCloseDate: result.last_close_date || new Date().toISOString().split('T')[0]
        });
        
        // Sincronizar com useGamificationStoreV21
        try {
          // Log removido temporariamente para reduzir spam durante debug
          
          const { useGamificationStoreV21 } = await import('@/stores/useGamificationStoreV21');
          useGamificationStoreV21.getState().syncVitalityFromSupabase(newVitalityValue);
          
          // Log removido temporariamente para reduzir spam durante debug
        } catch (err) {
          console.error('🔍 [VITALITY DEBUG] ❌ Erro ao sincronizar com GamificationStore:', err);
        }
      } else {
        // Se não há dados, usar valores padrão
        setVitalityState({
          value: 50,
          version: 0,
          lastCloseDate: new Date().toISOString().split('T')[0]
        });
      }
    } catch (err) {
      console.error('[Vitality V2.1] Erro inesperado ao sincronizar vitalidade:', err);
      setError('Erro inesperado ao sincronizar vitalidade');
    } finally {
      setIsLoading(false);
      setIsSyncing(false);
    }
  }, [user?.id, isSyncing]);

  // Aplicar evento de gamificação
  const applyEvent = useCallback(async (event: VitalityEvent) => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('[Vitality V2.1] Aplicando evento:', event);
      
      // Gerar ID único para o evento (UUID válido)
      const eventId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
      
      // Chamar RPC para aplicar evento
      const { data, error } = await supabase.rpc('vitality_apply_event', {
        p_user: user.id,
        p_event_id: eventId,
        p_type: event.type,
        p_payload: event.payload || {},
        p_expected_version: vitalityState.version
      });

      if (error) {
        console.error('[Vitality V2.1] Erro ao aplicar evento:', error);
        
        if (error.message.includes('version_conflict')) {
          // Conflito de versão - recarregar estado apenas uma vez
          console.log('[Vitality V2.1] Conflito de versão detectado, recarregando estado...');
          try {
            await syncOnOpen();
            console.log('[Vitality V2.1] Estado recarregado com sucesso após conflito de versão');
          } catch (syncError) {
            console.error('[Vitality V2.1] Erro ao recarregar estado após conflito:', syncError);
            setError('Erro ao sincronizar vitalidade após conflito de versão');
          }
        } else {
          setError('Erro ao aplicar evento de vitalidade');
        }
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        console.log('[Vitality V2.1] Evento aplicado com sucesso:', result);
        
        const newVitalityValue = Number(result.new_value) || vitalityState.value;
        
        setVitalityState({
          value: newVitalityValue,
          version: Number(result.new_version) || vitalityState.version + 1,
          lastCloseDate: vitalityState.lastCloseDate
        });
        
        // Sincronizar com useGamificationStoreV21
        try {
          const { useGamificationStoreV21 } = await import('@/stores/useGamificationStoreV21');
          useGamificationStoreV21.getState().syncVitalityFromSupabase(newVitalityValue);
        } catch (err) {
          console.warn('[Vitality V2.1] Erro ao sincronizar com GamificationStore após evento:', err);
        }
      }
    } catch (err) {
      console.error('[Vitality V2.1] Erro inesperado ao aplicar evento:', err);
      setError('Erro inesperado ao aplicar evento');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, vitalityState.value, vitalityState.version, syncOnOpen]);

  // Sincronizar automaticamente na abertura
  useEffect(() => {
    if (user?.id) {
      syncOnOpen();
    }
  }, [user?.id, syncOnOpen]);

  // Função para determinar o mood baseado na vitalidade
  const getMoodFromVitality = useCallback((vitality: number): 'tired' | 'sad' | 'neutral' | 'happy' | 'confident' => {
    if (vitality < 25) return 'sad';
    if (vitality < 50) return 'tired';
    if (vitality < 75) return 'neutral';
    if (vitality < 90) return 'happy';
    return 'confident';
  }, []);

  // Função para determinar o corpo baseado no XP e vitalidade
  const getBodyFromXp = useCallback((xp: number, vitality: number): string => {
    // Se vitalidade muito baixa, forçar corpo lvl_1
    if (vitality < 25) return '/Nadr00J/bodies/body_lvl1.png';
    
    // Caso contrário, usar lógica baseada no XP
    if (xp < 200) return '/Nadr00J/bodies/body_lvl1.png';
    if (xp < 600) return '/Nadr00J/bodies/body_lvl2.png';
    return '/Nadr00J/bodies/body_lvl3.png';
  }, []);

  // Função para determinar a cabeça baseada na vitalidade
  const getHeadFromVitality = useCallback((vitality: number): string => {
    if (vitality < 25) return '/Nadr00J/heads/head_sad.png';
    if (vitality < 50) return '/Nadr00J/heads/head_tired.png';
    if (vitality < 75) return '/Nadr00J/heads/head_neutral.png';
    if (vitality < 90) return '/Nadr00J/heads/head_happy.png';
    return '/Nadr00J/heads/head_confident.png';
  }, []);

  return {
    vitalityState,
    isLoading,
    error,
    syncOnOpen,
    applyEvent,
    getMoodFromVitality,
    getBodyFromXp,
    getHeadFromVitality,
    // Valores derivados para compatibilidade
    vitality: vitalityState.value,
    mood: getMoodFromVitality(vitalityState.value)
  };
};
