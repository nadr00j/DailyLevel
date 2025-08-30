import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { db } from '@/lib/database';
import { storage } from '@/lib/storage';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { useShopStore } from '@/stores/useShopStore';
import { useHabitStore } from '@/stores/useHabitStore';
import localforage from 'localforage';
import { defaultItems } from '@/stores/useShopStore'
import { dataSyncService } from '@/lib/DataSyncService';

export function useSupabaseSync() {
  const { user, isAuthenticated } = useAuthStore();

  // Sincronizar dados do Supabase para localStorage quando usuário fizer login
  const loadFromSupabase = useCallback(async (userId: string) => {
    try {
      console.log('🔄 Carregando todos os dados do Supabase via DataSyncService...');
      await dataSyncService.loadAll(userId);
    } catch (error) {
      console.error('❌ Erro ao carregar dados do Supabase:', error);
      throw error;
    }
  }, []);

  // Sincronizar dados locais para o Supabase
  const syncToSupabase = useCallback(async (userId: string) => {
    try {
      console.log('🔄 Sincronizando todos os dados para o Supabase via DataSyncService...');
      await dataSyncService.syncAll(userId);
    } catch (error) {
      console.error('❌ Erro ao sincronizar dados para o Supabase:', error);
    }
  }, []);

  // Carregar dados quando usuário fizer login
  const loadedRef = useRef(false);
  useEffect(() => {
    if (isAuthenticated && user && !loadedRef.current) {
      loadedRef.current = true;
      loadFromSupabase(user.id);
    }
  }, [isAuthenticated, user, loadFromSupabase]);

  return {
    loadFromSupabase,
    syncToSupabase
  };
}
