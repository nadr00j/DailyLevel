import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { useAuthStore } from '@/stores/useAuthStore'
import { useTaskStore } from '@/stores/useTaskStore'
import { useGamificationStoreV21 } from '@/stores/useGamificationStoreV21'
import { useHabitStore } from '@/stores/useHabitStore'
import { useGoalStore } from '@/stores/useGoalStore'
import { supabase } from '@/lib/supabase'
import { dataSyncService } from '@/lib/DataSyncService'

// Expor stores e serviços no window para debug (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  window.useAuthStore = useAuthStore;
  window.useTaskStore = useTaskStore;
  window.useGamificationStoreV21 = useGamificationStoreV21;
  window.useHabitStore = useHabitStore;
  window.useGoalStore = useGoalStore;
  window.supabase = supabase;
  window.dataSyncService = dataSyncService;
  console.log('🔧 [DEBUG] Stores e serviços expostos no window para desenvolvimento');
}

// Inicializar autenticação antes de renderizar o app
useAuthStore.getState().initialize().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
