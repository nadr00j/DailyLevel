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
import { useVitalityUpdate } from '@/hooks/useVitalityUpdate';

export default function Index() {
  const { activeTab } = useTabStore();
  const { isAuthenticated, user, isLoading, initialize } = useAuthStore();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationCompleted, setMigrationCompleted] = useState(false);
  
  // Hook para atualizar vitalidade automaticamente
  useVitalityUpdate();
  
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

  // Migrar dados locais quando usuário fizer login
  useEffect(() => {
    if (isAuthenticated && user && !isMigrating && !migrationCompleted) {
      handleDataMigration();
    }
  }, [isAuthenticated, user]);

  const handleDataMigration = async () => {
    if (!user) return;
    
    setIsMigrating(true);
    
    try {
      // Verificar se há dados locais para migrar (apenas uma vez)
      const localTasks = await storage.getTasks();
      const localHabits = await storage.getHabits();
      const localGoals = await storage.getGoals();
      
      const hasLocalData = localTasks.length > 0 || localHabits.length > 0 || localGoals.length > 0;
      
      if (hasLocalData) {
        console.log('Dados locais encontrados, executando migração...');
        const result = await migrateLocalDataToSupabase(user.id);
        
        if (result.success) {
          toast({
            title: 'Migração concluída!',
            description: `Migrados: ${result.migratedData?.tasks || 0} tarefas, ${result.migratedData?.habits || 0} hábitos, ${result.migratedData?.goals || 0} metas`,
          });
          
          // Limpar dados locais após migração bem-sucedida
          await storage.clearAll();
          console.log('Dados locais limpos após migração');
        } else {
          toast({
            title: 'Migração não necessária',
            description: result.message,
            variant: 'default',
          });
        }
      } else {
        console.log('Nenhum dado local encontrado, pulando migração');
      }
      
      // SEMPRE inicializar dados padrão no Supabase
      await initializeUserData(user.id);
      
      // Carregar dados do Supabase para o localStorage
      await loadFromSupabase(user.id);
      
      toast({
        title: 'App inicializado!',
        description: 'Dados carregados do Supabase com sucesso.',
      });
      
    } catch (error) {
      console.error('Erro na migração:', error);
      toast({
        title: 'Erro na inicialização',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      });
    } finally {
      setIsMigrating(false);
      setMigrationCompleted(true);
    }
  };

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
      
      <ShopModal />
      <VictoryDialog />
    </>
  );
}
