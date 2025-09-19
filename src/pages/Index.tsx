import React, { useEffect, useState } from 'react';
import { TodayView } from '@/views/TodayView';
import { HabitsView } from '@/views/HabitsView';
import { TasksView } from '@/views/TasksView';
import { GoalsView } from '@/views/GoalsView';
import { AppLayout } from '@/components/layout/AppLayout';
import { useTabStore } from '@/stores/useTabStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { LoginForm } from '@/components/auth/LoginForm';
import { Toaster } from '@/components/ui/toaster';
import { ShopModal } from '@/components/gamification/ShopModal';
import { VictoryDialog } from '@/components/ui/VictoryDialog';
import { migrateLocalDataToSupabase, initializeUserData } from '@/lib/migration';
import { toast } from '@/components/ui/use-toast';
import { storage } from '@/lib/storage';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { useAutoSync } from '@/hooks/useAutoSync';

export default function Index() {
  const { activeTab } = useTabStore();
  const { isAuthenticated, user, isLoading, initialize } = useAuthStore();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationCompleted, setMigrationCompleted] = useState(false);
  
  
  // Hook para sincronização com Supabase
  const { loadFromSupabase, syncToSupabase } = useSupabaseSync();
  
  // Hook para auto-sincronização
  useAutoSync();

  // Inicializar autenticação
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Resetar estado de migração quando usuário fizer logout
  useEffect(() => {
    if (!isAuthenticated) {
      setMigrationCompleted(false);
      setIsMigrating(false);
    }
  }, [isAuthenticated]);

  // Removida migração automática local -> Supabase para evitar requisições repetidas
  // useSupabaseSync irá carregar dados do Supabase

  // Desabilitado handleDataMigration para usar apenas useSupabaseSync

  // Mostrar loading enquanto inicializa
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, mostrar tela de login
  if (!isAuthenticated) {
    return (
      <>
        <LoginForm />
        <Toaster />
      </>
    );
  }

  // Se estiver migrando, mostrar indicador
  if (isMigrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Migrando dados...</p>
        </div>
      </div>
    );
  }

  // Se estiver autenticado, mostrar a aplicação normal
  return (
    <>
      <AppLayout>
        {activeTab === 'today' && <TodayView />}
        {activeTab === 'habits' && <HabitsView />}
        {activeTab === 'tasks' && <TasksView />}
        {activeTab === 'goals' && <GoalsView />}
      </AppLayout>
      
    </>
  );
}
