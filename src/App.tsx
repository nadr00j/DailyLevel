import React, { useEffect, useRef } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { useAuthStore } from '@/stores/useAuthStore';
import { useGamificationStoreV21 } from '@/stores/useGamificationStoreV21';
import { dataSyncService } from '@/lib/DataSyncService';
import { VitalityListener } from '@/components/gamification/VitalityListener';
import { GamificationListener } from '@/components/gamification/GamificationListener';
import { useAutoSync } from '@/hooks/useAutoSync';

const queryClient = new QueryClient();

const App = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { setUserId } = useGamificationStoreV21();
  const isInitializedRef = useRef(false);
  
  // Hook para sincronização automática
  useAutoSync();
  
  useEffect(() => {
    console.log('[App] useEffect executado:', { 
      isAuthenticated, 
      isLoading, 
      user: user?.id,
      userEmail: user?.email 
    });
    
    // Verificações rigorosas para evitar userId undefined e múltiplas execuções
    if (isAuthenticated && user?.id && user.id !== 'undefined' && !isLoading && !isInitializedRef.current) {
      console.log('[App] Usuário autenticado, definindo userId no store:', user.id);
      
      // Marcar como inicializado para evitar múltiplas execuções
      isInitializedRef.current = true;
      
      // Definir userId no store de gamificação usando hook
      setUserId(user.id);
      console.log('[App] userId definido no store de gamificação');
      
      console.log('[App] Chamando dataSyncService.loadAll para userId:', user.id);
      dataSyncService.loadAll(user.id).catch(error => {
        console.error('[App] Erro no loadAll:', error);
      });
    } else {
      console.log('[App] Condições não atendidas para loadAll:', {
        isAuthenticated,
        hasUser: !!user,
        userId: user?.id,
        userIdValid: user?.id && user.id !== 'undefined',
        isLoading,
        alreadyInitialized: isInitializedRef.current
      });
    }
  }, [isAuthenticated, user?.id, isLoading]);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark">
          <Toaster />
          <Sonner />
          <VitalityListener />
          <GamificationListener />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
